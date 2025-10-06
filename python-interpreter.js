/**
 * Minimal Python-like Interpreter for Robot Game
 * Supports: variables, loops, conditionals, bot API calls
 * Safety: No eval, no DOM access, operation limits
 */

class PythonInterpreter {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.maxOperations = 5000;
        this.maxWhileIterations = 1000;
        this.maxNestedBlocks = 10;
        this.operationCount = 0;
        this.nestedBlocks = 0;
        
        // Runtime environment
        this.globals = {
            bot: this.createBotAPI(),
            range: this.createRangeFunction()
        };
        this.variables = new Map();
        this.callStack = [];
        
        // Lexer tokens
        this.tokens = [];
        this.currentToken = 0;
    }

    createBotAPI() {
        const self = this;
        return {
            move_forward() { return self.executeBotCommand('move_forward'); },
            move_backward() { return self.executeBotCommand('move_backward'); },
            turn_left() { return self.executeBotCommand('turn_left'); },
            turn_right() { return self.executeBotCommand('turn_right'); },
            can_move() { return self.executeBotCommand('can_move'); },
            get x() { return self.game.robot.x; },
            get y() { return self.game.robot.y; },
            get direction() { return self.game.robot.direction; },
            get keys() { return self.game.robot.keys; }
        };
    }

    createRangeFunction() {
        const self = this;
        return function(start, stop, step = 1) {
            if (arguments.length === 1) {
                stop = start;
                start = 0;
            }
            const result = [];
            for (let i = start; i < stop; i += step) {
                result.push(i);
            }
            return result;
        };
    }

    async executeBotCommand(command) {
        this.operationCount++;
        this.checkOperationLimit();
        
        switch (command) {
            case 'move_forward':
                this.game.robot.move_forward();
                break;
            case 'move_backward':
                this.game.robot.move_backward();
                break;
            case 'turn_left':
                this.game.robot.turn_left();
                break;
            case 'turn_right':
                this.game.robot.turn_right();
                break;
            case 'can_move':
                return this.game.robot.can_move();
        }
        
        // Update UI after each bot command
        this.game.updateRobotInfo();
        this.game.updateProgress();
        
        // Small delay for visualization
        await this.sleep(150);
        
        return true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    checkOperationLimit() {
        if (this.operationCount > this.maxOperations) {
            throw new Error(`Maximum operations limit exceeded (${this.maxOperations}). Code may be too complex or contain infinite loops.`);
        }
    }

    checkNestingLimit() {
        if (this.nestedBlocks > this.maxNestedBlocks) {
            throw new Error(`Maximum nesting depth exceeded (${this.maxNestedBlocks}). Code structure is too deeply nested.`);
        }
    }

    // Lexer
    tokenize(code) {
        const tokens = [];
        const lines = code.split('\n');
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            
            // Calculate indentation
            const indent = this.getIndentationLevel(line);
            tokens.push({ type: 'INDENT', value: indent, line: lineNum + 1 });
            
            // Tokenize the line content
            const lineTokens = this.tokenizeLine(trimmed, lineNum + 1);
            tokens.push(...lineTokens);
            tokens.push({ type: 'NEWLINE', line: lineNum + 1 });
        }
        
        tokens.push({ type: 'EOF' });
        return tokens;
    }

    getIndentationLevel(line) {
        return line.length - line.trimStart().length;
    }

    tokenizeLine(line, lineNum) {
        const tokens = [];
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            
            if (char === ' ') {
                i++;
                continue;
            }
            
            // Keywords
            if (line.substr(i, 2) === 'if' && !this.isAlphaNumeric(line[i + 2])) {
                tokens.push({ type: 'IF', value: 'if', line: lineNum });
                i += 2;
            } else if (line.substr(i, 4) === 'elif' && !this.isAlphaNumeric(line[i + 4])) {
                tokens.push({ type: 'ELIF', value: 'elif', line: lineNum });
                i += 4;
            } else if (line.substr(i, 4) === 'else' && !this.isAlphaNumeric(line[i + 4])) {
                tokens.push({ type: 'ELSE', value: 'else', line: lineNum });
                i += 4;
            } else if (line.substr(i, 3) === 'for' && !this.isAlphaNumeric(line[i + 3])) {
                tokens.push({ type: 'FOR', value: 'for', line: lineNum });
                i += 3;
            } else if (line.substr(i, 5) === 'while' && !this.isAlphaNumeric(line[i + 5])) {
                tokens.push({ type: 'WHILE', value: 'while', line: lineNum });
                i += 5;
            } else if (line.substr(i, 4) === 'pass' && !this.isAlphaNumeric(line[i + 4])) {
                tokens.push({ type: 'PASS', value: 'pass', line: lineNum });
                i += 4;
            } else if (line.substr(i, 3) === 'and' && !this.isAlphaNumeric(line[i + 3])) {
                tokens.push({ type: 'AND', value: 'and', line: lineNum });
                i += 3;
            } else if (line.substr(i, 2) === 'or' && !this.isAlphaNumeric(line[i + 2])) {
                tokens.push({ type: 'OR', value: 'or', line: lineNum });
                i += 2;
            } else if (line.substr(i, 3) === 'not' && !this.isAlphaNumeric(line[i + 3])) {
                tokens.push({ type: 'NOT', value: 'not', line: lineNum });
                i += 3;
            } else if (line.substr(i, 5) === 'range' && !this.isAlphaNumeric(line[i + 5])) {
                tokens.push({ type: 'RANGE', value: 'range', line: lineNum });
                i += 5;
            }
            // Identifiers
            else if (this.isAlpha(char)) {
                const identifier = this.consumeIdentifier(line, i);
                tokens.push({ type: 'IDENTIFIER', value: identifier, line: lineNum });
                i += identifier.length;
            }
            // Numbers
            else if (this.isDigit(char)) {
                const number = this.consumeNumber(line, i);
                tokens.push({ type: 'NUMBER', value: parseInt(number), line: lineNum });
                i += number.length;
            }
            // Strings
            else if (char === '"' || char === "'") {
                const string = this.consumeString(line, i);
                tokens.push({ type: 'STRING', value: string, line: lineNum });
                i += string.length + 2;
            }
            // Operators and punctuation
            else if (char === '=' && line[i + 1] === '=') {
                tokens.push({ type: 'EQ', value: '==', line: lineNum });
                i += 2;
            } else if (char === '!' && line[i + 1] === '=') {
                tokens.push({ type: 'NE', value: '!=', line: lineNum });
                i += 2;
            } else if (char === '<' && line[i + 1] === '=') {
                tokens.push({ type: 'LE', value: '<=', line: lineNum });
                i += 2;
            } else if (char === '>' && line[i + 1] === '=') {
                tokens.push({ type: 'GE', value: '>=', line: lineNum });
                i += 2;
            } else if (char === '<') {
                tokens.push({ type: 'LT', value: '<', line: lineNum });
                i++;
            } else if (char === '>') {
                tokens.push({ type: 'GT', value: '>', line: lineNum });
                i++;
            } else if (char === '+') {
                tokens.push({ type: 'PLUS', value: '+', line: lineNum });
                i++;
            } else if (char === '-') {
                tokens.push({ type: 'MINUS', value: '-', line: lineNum });
                i++;
            } else if (char === '*') {
                tokens.push({ type: 'MULTIPLY', value: '*', line: lineNum });
                i++;
            } else if (char === '/' && line[i + 1] === '/') {
                tokens.push({ type: 'FLOOR_DIV', value: '//', line: lineNum });
                i += 2;
            } else if (char === '%') {
                tokens.push({ type: 'MODULO', value: '%', line: lineNum });
                i++;
            } else if (char === '=') {
                tokens.push({ type: 'ASSIGN', value: '=', line: lineNum });
                i++;
            } else if (char === ':') {
                tokens.push({ type: 'COLON', value: ':', line: lineNum });
                i++;
            } else if (char === '(') {
                tokens.push({ type: 'LPAREN', value: '(', line: lineNum });
                i++;
            } else if (char === ')') {
                tokens.push({ type: 'RPAREN', value: ')', line: lineNum });
                i++;
            } else if (char === ',') {
                tokens.push({ type: 'COMMA', value: ',', line: lineNum });
                i++;
            } else if (char === 'i' && line[i + 1] === 'n' && !this.isAlphaNumeric(line[i + 2])) {
                tokens.push({ type: 'IN', value: 'in', line: lineNum });
                i += 2;
            }
            else {
                i++; // Skip unknown characters
            }
        }
        
        return tokens;
    }

    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
    }

    isAlphaNumeric(char) {
        return /[a-zA-Z0-9_]/.test(char);
    }

    isDigit(char) {
        return /[0-9]/.test(char);
    }

    consumeIdentifier(line, start) {
        let i = start;
        while (i < line.length && this.isAlphaNumeric(line[i])) {
            i++;
        }
        return line.substr(start, i - start);
    }

    consumeNumber(line, start) {
        let i = start;
        while (i < line.length && this.isDigit(line[i])) {
            i++;
        }
        return line.substr(start, i - start);
    }

    consumeString(line, start) {
        const quote = line[start];
        let i = start + 1;
        while (i < line.length && line[i] !== quote) {
            i++;
        }
        return line.substr(start + 1, i - start - 1);
    }

    // Parser
    parse(code) {
        this.tokens = this.tokenize(code);
        this.currentToken = 0;
        this.nestedBlocks = 0;
        
        const statements = [];
        
        while (!this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
        }
        
        return statements;
    }

    isAtEnd() {
        return this.tokens[this.currentToken].type === 'EOF';
    }

    peek() {
        return this.tokens[this.currentToken];
    }

    advance() {
        if (!this.isAtEnd()) {
            this.currentToken++;
        }
        return this.tokens[this.currentToken - 1];
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();
        throw new Error(`${message} at line ${this.peek().line}`);
    }

    parseStatement() {
        try {
            if (this.match('IF')) return this.parseIfStatement();
            if (this.match('FOR')) return this.parseForStatement();
            if (this.match('WHILE')) return this.parseWhileStatement();
            if (this.match('PASS')) return { type: 'pass' };
            
            return this.parseExpressionStatement();
        } catch (error) {
            this.synchronize();
            return null;
        }
    }

    parseIfStatement() {
        const condition = this.parseExpression();
        this.consume('COLON', "Expected ':' after if condition");
        
        const thenBranch = this.parseBlock();
        let elifBranches = [];
        let elseBranch = null;
        
        // Parse elif branches
        while (this.check('ELIF')) {
            this.advance(); // consume 'elif'
            const elifCondition = this.parseExpression();
            this.consume('COLON', "Expected ':' after elif condition");
            const elifBody = this.parseBlock();
            elifBranches.push({ condition: elifCondition, body: elifBody });
        }
        
        // Parse else branch
        if (this.check('ELSE')) {
            this.advance(); // consume 'else'
            this.consume('COLON', "Expected ':' after else");
            elseBranch = this.parseBlock();
        }
        
        return {
            type: 'if',
            condition,
            thenBranch,
            elifBranches,
            elseBranch
        };
    }

    parseForStatement() {
        const variable = this.consume('IDENTIFIER', 'Expected variable name').value;
        this.consume('IN', "Expected 'in' after for variable");
        
        // Parse range expression
        this.consume('RANGE', "Expected 'range' in for loop");
        this.consume('LPAREN', "Expected '(' after range");
        
        const args = [];
        if (!this.check('RPAREN')) {
            args.push(this.parseExpression());
            if (this.match('COMMA')) {
                args.push(this.parseExpression());
                if (this.match('COMMA')) {
                    args.push(this.parseExpression());
                }
            }
        }
        
        this.consume('RPAREN', "Expected ')' after range arguments");
        this.consume('COLON', "Expected ':' after for loop");
        
        const body = this.parseBlock();
        
        return {
            type: 'for',
            variable,
            args,
            body
        };
    }

    parseWhileStatement() {
        const condition = this.parseExpression();
        this.consume('COLON', "Expected ':' after while condition");
        
        const body = this.parseBlock();
        
        return {
            type: 'while',
            condition,
            body
        };
    }

    parseBlock() {
        const statements = [];
        
        // Expect indented block
        if (!this.check('INDENT')) {
            // Single line statement
            return [this.parseStatement()];
        }
        
        const baseIndent = this.advance().value;
        
        while (!this.isAtEnd() && this.check('INDENT') && this.peek().value > baseIndent) {
            this.advance(); // consume indent
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
            this.consume('NEWLINE', "Expected newline after statement");
        }
        
        return statements;
    }

    parseExpressionStatement() {
        const expr = this.parseExpression();
        
        // Check if it's an assignment
        if (this.match('ASSIGN')) {
            if (expr.type !== 'variable') {
                throw new Error('Left side of assignment must be a variable');
            }
            const value = this.parseExpression();
            return {
                type: 'assign',
                name: expr.name,
                value
            };
        }
        
        return {
            type: 'expression',
            expression: expr
        };
    }

    parseExpression() {
        return this.parseOr();
    }

    parseOr() {
        let expr = this.parseAnd();
        
        while (this.match('OR')) {
            const operator = this.previous();
            const right = this.parseAnd();
            expr = {
                type: 'binary',
                left: expr,
                operator,
                right
            };
        }
        
        return expr;
    }

    parseAnd() {
        let expr = this.parseNot();
        
        while (this.match('AND')) {
            const operator = this.previous();
            const right = this.parseNot();
            expr = {
                type: 'binary',
                left: expr,
                operator,
                right
            };
        }
        
        return expr;
    }

    parseNot() {
        if (this.match('NOT')) {
            const operator = this.previous();
            const right = this.parseNot();
            return {
                type: 'unary',
                operator,
                right
            };
        }
        
        return this.parseComparison();
    }

    parseComparison() {
        let expr = this.parseTerm();
        
        while (this.match('GT', 'GE', 'LT', 'LE')) {
            const operator = this.previous();
            const right = this.parseTerm();
            expr = {
                type: 'binary',
                left: expr,
                operator,
                right
            };
        }
        
        return expr;
    }

    parseTerm() {
        let expr = this.parseFactor();
        
        while (this.match('PLUS', 'MINUS')) {
            const operator = this.previous();
            const right = this.parseFactor();
            expr = {
                type: 'binary',
                left: expr,
                operator,
                right
            };
        }
        
        return expr;
    }

    parseFactor() {
        let expr = this.parseUnary();
        
        while (this.match('MULTIPLY', 'FLOOR_DIV', 'MODULO')) {
            const operator = this.previous();
            const right = this.parseUnary();
            expr = {
                type: 'binary',
                left: expr,
                operator,
                right
            };
        }
        
        return expr;
    }

    parseUnary() {
        if (this.match('MINUS', 'NOT')) {
            const operator = this.previous();
            const right = this.parseUnary();
            return {
                type: 'unary',
                operator,
                right
            };
        }
        
        return this.parseEquality();
    }

    parseEquality() {
        let expr = this.parsePrimary();
        
        while (this.match('EQ', 'NE')) {
            const operator = this.previous();
            const right = this.parsePrimary();
            expr = {
                type: 'binary',
                left: expr,
                operator,
                right
            };
        }
        
        return expr;
    }

    parsePrimary() {
        if (this.match('NUMBER')) {
            return { type: 'number', value: this.previous().value };
        }
        
        if (this.match('STRING')) {
            return { type: 'string', value: this.previous().value };
        }
        
        if (this.match('IDENTIFIER')) {
            const name = this.previous().value;
            
            // Check if it's a function call
            if (this.match('LPAREN')) {
                const args = [];
                if (!this.check('RPAREN')) {
                    args.push(this.parseExpression());
                    while (this.match('COMMA')) {
                        args.push(this.parseExpression());
                    }
                }
                this.consume('RPAREN', "Expected ')' after arguments");
                
                return {
                    type: 'call',
                    name,
                    args
                };
            }
            
            return { type: 'variable', name };
        }
        
        if (this.match('LPAREN')) {
            const expr = this.parseExpression();
            this.consume('RPAREN', "Expected ')' after expression");
            return expr;
        }
        
        throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
    }

    previous() {
        return this.tokens[this.currentToken - 1];
    }

    synchronize() {
        this.advance();
        
        while (!this.isAtEnd()) {
            if (this.previous().type === 'NEWLINE') return;
            
            switch (this.peek().type) {
                case 'IF':
                case 'FOR':
                case 'WHILE':
                case 'ELSE':
                case 'ELIF':
                    return;
            }
            
            this.advance();
        }
    }

    // Interpreter
    async execute(statements) {
        this.operationCount = 0;
        this.nestedBlocks = 0;
        
        try {
            for (const statement of statements) {
                await this.executeStatement(statement);
            }
        } catch (error) {
            throw new Error(`Runtime error: ${error.message}`);
        }
    }

    async executeStatement(statement) {
        switch (statement.type) {
            case 'expression':
                await this.evaluate(statement.expression);
                break;
            case 'assign':
                const value = await this.evaluate(statement.value);
                this.variables.set(statement.name, value);
                break;
            case 'if':
                await this.executeIfStatement(statement);
                break;
            case 'for':
                await this.executeForStatement(statement);
                break;
            case 'while':
                await this.executeWhileStatement(statement);
                break;
            case 'pass':
                // Do nothing
                break;
        }
    }

    async executeIfStatement(statement) {
        const condition = await this.evaluate(statement.condition);
        
        if (this.isTruthy(condition)) {
            await this.executeBlock(statement.thenBranch);
            return;
        }
        
        // Check elif branches
        for (const elif of statement.elifBranches) {
            const elifCondition = await this.evaluate(elif.condition);
            if (this.isTruthy(elifCondition)) {
                await this.executeBlock(elif.body);
                return;
            }
        }
        
        // Execute else branch if present
        if (statement.elseBranch) {
            await this.executeBlock(statement.elseBranch);
        }
    }

    async executeForStatement(statement) {
        this.nestedBlocks++;
        this.checkNestingLimit();
        
        // Create range
        const rangeArgs = statement.args;
        let range;
        
        if (rangeArgs.length === 1) {
            range = this.globals.range(0, rangeArgs[0]);
        } else if (rangeArgs.length === 2) {
            range = this.globals.range(rangeArgs[0], rangeArgs[1]);
        } else if (rangeArgs.length === 3) {
            range = this.globals.range(rangeArgs[0], rangeArgs[1], rangeArgs[2]);
        } else {
            throw new Error('range() takes 1-3 arguments');
        }
        
        for (const value of range) {
            this.variables.set(statement.variable, value);
            await this.executeBlock(statement.body);
        }
        
        this.nestedBlocks--;
    }

    async executeWhileStatement(statement) {
        this.nestedBlocks++;
        this.checkNestingLimit();
        
        let iterations = 0;
        
        while (this.isTruthy(await this.evaluate(statement.condition))) {
            if (iterations++ > this.maxWhileIterations) {
                throw new Error(`While loop exceeded maximum iterations (${this.maxWhileIterations})`);
            }
            
            await this.executeBlock(statement.body);
        }
        
        this.nestedBlocks--;
    }

    async executeBlock(statements) {
        for (const statement of statements) {
            await this.executeStatement(statement);
        }
    }

    async evaluate(expr) {
        switch (expr.type) {
            case 'number':
            case 'string':
                return expr.value;
            
            case 'variable':
                if (this.variables.has(expr.name)) {
                    return this.variables.get(expr.name);
                }
                if (expr.name in this.globals) {
                    return this.globals[expr.name];
                }
                throw new Error(`Undefined variable: ${expr.name}`);
            
            case 'binary':
                const left = await this.evaluate(expr.left);
                const right = await this.evaluate(expr.right);
                
                switch (expr.operator.type) {
                    case 'PLUS': return left + right;
                    case 'MINUS': return left - right;
                    case 'MULTIPLY': return left * right;
                    case 'FLOOR_DIV': return Math.floor(left / right);
                    case 'MODULO': return left % right;
                    case 'GT': return left > right;
                    case 'GE': return left >= right;
                    case 'LT': return left < right;
                    case 'LE': return left <= right;
                    case 'EQ': return this.isEqual(left, right);
                    case 'NE': return !this.isEqual(left, right);
                    case 'AND': return this.isTruthy(left) && this.isTruthy(right);
                    case 'OR': return this.isTruthy(left) || this.isTruthy(right);
                }
                break;
            
            case 'unary':
                const operand = await this.evaluate(expr.right);
                switch (expr.operator.type) {
                    case 'MINUS': return -operand;
                    case 'NOT': return !this.isTruthy(operand);
                }
                break;
            
            case 'call':
                return await this.callFunction(expr.name, expr.args);
        }
        
        throw new Error(`Unknown expression type: ${expr.type}`);
    }

    async callFunction(name, args) {
        const evaluatedArgs = [];
        for (const arg of args) {
            evaluatedArgs.push(await this.evaluate(arg));
        }
        
        if (name in this.globals && typeof this.globals[name] === 'function') {
            return await this.globals[name](...evaluatedArgs);
        }
        
        throw new Error(`Undefined function: ${name}`);
    }

    isTruthy(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        return true;
    }

    isEqual(a, b) {
        return a === b;
    }
}

// Export for use in game.html
window.PythonInterpreter = PythonInterpreter;

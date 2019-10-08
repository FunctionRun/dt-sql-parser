import * as  dtSqlParser from '../src';
import { SyntaxResult } from '../src/core/sqlSyntaxParser';
const parser = dtSqlParser.parser;
const filter = dtSqlParser.filter;
const flinksqlParser = dtSqlParser.flinksqlParser;


describe('complete test', () => {
    describe('hive', () => {
        test('complete result', () => {
            const sql = 'select id,name from user ';
            const result = parser.parserSql([sql, ''], dtSqlParser.parser.sqlType.Hive);
            expect(result.locations).toBeInstanceOf(Array);
            expect(result.suggestKeywords).toBeInstanceOf(Array);
        });
        test('empty result', () => {
            const sql = 'i';
            const result = parser.parserSql([sql, ''], dtSqlParser.parser.sqlType.Hive);
            expect(result.locations).toBeInstanceOf(Array);
            expect(result.locations).toHaveLength(0);
            expect(result.suggestKeywords).toBeInstanceOf(Array);
        })
    })
})

describe('syntax test', () => {
    describe('hive', () => {
        test('no error', () => {
            const sql = 'select id,name from user ';
            const result = parser.parseSyntax([sql, ''], dtSqlParser.parser.sqlType.Hive);
            expect(result).toBe(false);
        });
        test('select table should not be null', () => {
            const sql = 'select id,name from ';
            const result = parser.parseSyntax([sql, ''], dtSqlParser.parser.sqlType.Hive) as SyntaxResult;
            expect(result.loc).toEqual({
                first_line: 1,
                last_line: 1,
                first_column: 20,
                last_column: 20
            })
        });
        test('sql contains the wrong keyword', () => {
            const sql = `create table if not 1exists ods_order_header (
                order_header_id     string comment 'order id'
               ,order_date          bigint comment 'order date'
           )comment 'order table'
           PARTITIONED BY (ds string);`;
            const result = parser.parseSyntax([sql, ''], dtSqlParser.parser.sqlType.Hive) as SyntaxResult;
            expect(result.text).toBe('1exists');
            expect(result.loc).toEqual({
                first_line: 1,
                last_line: 1,
                first_column: 20,
                last_column: 27
            })
        });
    })
    describe('flinksql', () => {
        test('no error', () => {
            const sql = `select id from user.id;`;
            const result = flinksqlParser(sql);
            expect(result).toBeNull();
        });
        test('empty sql', () => {
            const sql = ``;
            const result = flinksqlParser(sql);
            expect(result).toBeNull();
        });
        test('sql comment', () => {
            const sql = `-- name asf
            -- type FlinkSQL
            -- author admin@dtstack.com
            -- create time 2019-06-12 18:11:05
            -- desc `;
            const result = flinksqlParser(sql);
            expect(result).toBeNull();
        });
        test('position', () => {
            const sql = `selec`;
            const result = flinksqlParser(sql);
            expect(result.token.start).toBe(0);
            expect(result.token.stop).toBe(4);
        });
        test('test lateral table', () => {
            const sql = `select 
            id 
            FROM 
            userTable, LATERAL table(json(mess)) as t(ord, name_id);`;
            const result = flinksqlParser(sql);
            expect(result).toBeNull();
        });
        test('syntax error', () => {
            const sql = 'select id from user.id; \nselect id from us*er.id; \nselect id from *user.id;';
            const result = flinksqlParser(sql);
            expect(result).toMatchObject({
                line: 2,
                column: 17,
            });
            expect(result.token.start).toBe(42);
            expect(result.token.stop).toBe(42);
            const sql2 = `CREATE TABLE MyTable(
                message.after.id int AS id,
                message.after.userid varchar AS userid,
                message.after.username varchar AS username,
                message.after.prodid varchar AS prodid,
                message.after.price double AS price,
                message.after.amount int AS amount,
                message.after.discount double AS discount,
                message.after.tm timestamp AS tm,
                WATERMARK FOR tm AS withOffset(tm,1000)
                 )WITH(
                    'type' ='kafka11,
                    topic ='1'
                 );
                
                CREATE TABLE MyResult(
                    a double,
                    b timestamp,
                    c timestamp
                 )WITH(
                    type ='mysql',
                    url ='jdbc:mysql://1:3306/yanxi?charset=utf8'
                 );
                
                insert into MyResult
                select 
                    sum(price * amount * discount) as a,
                    TUMBLE_START( ROWTIME, INTERVAL '30' SECOND) as b
                from MyTable
                 group by
                     TUMBLE( ROWTIME, INTERVAL '30' SECOND);`;
            const result2 = flinksqlParser(sql2);
            expect(result2).not.toBeNull();
        });
    })
})
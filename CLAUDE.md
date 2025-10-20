This is the redis used by reddit, its not using normal redis functions so anything redis related needs to follow this:

export declare class RedisClient implements RedisClientLike {

&nbsp;   #private;

&nbsp;   readonly global: Omit<RedisClientLike, 'global'>;

&nbsp;   constructor(scope: RedisKeyScope);

&nbsp;   watch(...keys: string\[]): Promise<TxClientLike>;

&nbsp;   get(key: string): Promise<string | undefined>;

&nbsp;   getBuffer(key: string): Promise<Buffer | undefined>;

&nbsp;   set(key: string, value: string, options?: SetOptions): Promise<string>;

&nbsp;   exists(...keys: string\[]): Promise<number>;

&nbsp;   del(...keys: string\[]): Promise<void>;

&nbsp;   incrBy(key: string, value: number): Promise<number>;

&nbsp;   getRange(key: string, start: number, end: number): Promise<string>;

&nbsp;   setRange(key: string, offset: number, value: string): Promise<number>;

&nbsp;   strLen(key: string): Promise<number>;

&nbsp;   expire(key: string, seconds: number): Promise<void>;

&nbsp;   expireTime(key: string): Promise<number>;

&nbsp;   zAdd(key: string, ...members: ZMember\[]): Promise<number>;

&nbsp;   zRange(key: string, start: number | string, stop: number | string, options?: ZRangeOptions): Promise<{

&nbsp;       member: string;

&nbsp;       score: number;

&nbsp;   }\[]>;

&nbsp;   zRem(key: string, members: string\[]): Promise<number>;

&nbsp;   zRemRangeByLex(key: string, min: string, max: string): Promise<number>;

&nbsp;   zRemRangeByRank(key: string, start: number, stop: number): Promise<number>;

&nbsp;   zRemRangeByScore(key: string, min: number, max: number): Promise<number>;

&nbsp;   zScore(key: string, member: string): Promise<number | undefined>;

&nbsp;   zRank(key: string, member: string): Promise<number | undefined>;

&nbsp;   zIncrBy(key: string, member: string, value: number): Promise<number>;

&nbsp;   mGet(keys: string\[]): Promise<(string | null)\[]>;

&nbsp;   mSet(keyValues: {

&nbsp;       \[key: string]: string;

&nbsp;   }): Promise<void>;

&nbsp;   zCard(key: string): Promise<number>;

&nbsp;   zScan(key: string, cursor: number, pattern?: string | undefined, count?: number | undefined): Promise<ZScanResponse>;

&nbsp;   type(key: string): Promise<string>;

&nbsp;   rename(key: string, newKey: string): Promise<string>;

&nbsp;   hGet(key: string, field: string): Promise<string | undefined>;

&nbsp;   hMGet(key: string, fields: string\[]): Promise<(string | null)\[]>;

&nbsp;   hSet(key: string, fieldValues: {

&nbsp;       \[field: string]: string;

&nbsp;   }): Promise<number>;

&nbsp;   hSetNX(key: string, field: string, value: string): Promise<number>;

&nbsp;   hGetAll(key: string): Promise<Record<string, string>>;

&nbsp;   hDel(key: string, fields: string\[]): Promise<number>;

&nbsp;   hScan(key: string, cursor: number, pattern?: string | undefined, count?: number | undefined): Promise<HScanResponse>;

&nbsp;   hKeys(key: string): Promise<string\[]>;

&nbsp;   hIncrBy(key: string, field: string, value: number): Promise<number>;

&nbsp;   hLen(key: string): Promise<number>;

&nbsp;   bitfield(key: string, ...cmds: \[] | BitfieldCommand | \[...BitfieldCommand, ...BitfieldCommand] | \[...BitfieldCommand, ...BitfieldCommand, ...BitfieldCommand, ...(number | string)\[]]): Promise<number\[]>;

}

export declare const redis: RedisClient;


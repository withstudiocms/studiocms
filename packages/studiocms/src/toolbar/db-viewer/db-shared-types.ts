export type QueryRequest = {
	readonly type: 'query';
	readonly id: number;
	readonly statement: string;
};

export type TransactionRequest = {
	readonly type: 'transaction';
	readonly id: number;
	readonly statements: readonly string[];
};

export type DbQueryRequest = QueryRequest | TransactionRequest;

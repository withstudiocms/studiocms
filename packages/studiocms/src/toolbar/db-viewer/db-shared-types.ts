export type QueryRequest = {
	type: 'query';
	id: number;
	statement: string;
};

export type TransactionRequest = {
	type: 'transaction';
	id: number;
	statements: string[];
};

export type DbQueryRequest = QueryRequest | TransactionRequest;

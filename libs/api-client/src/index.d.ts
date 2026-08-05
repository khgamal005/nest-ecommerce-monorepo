export interface ApiOptions extends RequestInit {
    token?: string;
}
export declare function apiFetch<T>(path: string, options?: ApiOptions): Promise<T>;
//# sourceMappingURL=index.d.ts.map
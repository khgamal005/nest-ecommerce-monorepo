declare const useUser: () => {
    user: any;
    isLoading: boolean;
    isFetching: boolean;
    error: any;
    refetch: (options?: import("@tanstack/react-query").RefetchOptions) => Promise<import("@tanstack/react-query").QueryObserverResult<any, any>>;
    logout: () => Promise<void>;
    isLoggingOut: boolean;
    sessionPending: any;
    hasSession: any;
};
export default useUser;
export { useUser };
//# sourceMappingURL=use-user.d.ts.map
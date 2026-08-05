"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUser = void 0;
const authStore_1 = require("@/store/authStore");
const react_query_1 = require("@tanstack/react-query");
const axiosInstance_1 = __importDefault(require("@/utils/axiosInstance"));
const react_1 = require("react");
const Protected_1 = require("@/utils/Protected");
const user_1 = require("@/types/user");
const fetchUser = async () => {
    const response = await axiosInstance_1.default.get('/api/auth/me', Protected_1.isProtected);
    return response.data.user;
};
const logoutUser = async () => {
    const response = await axiosInstance_1.default.post('/api/auth/logout');
    return response.data;
};
const useUser = () => {
    const queryClient = (0, react_query_1.useQueryClient)();
    const clientSession = (0, authStore_1.useAuthStore)((state) => state.clientSession);
    const storeUser = (0, authStore_1.useAuthStore)((state) => state.user);
    const setUser = (0, authStore_1.useAuthStore)((state) => state.setUser);
    const resetAuth = (0, authStore_1.useAuthStore)((state) => state.reset);
    const loggedOut = (0, authStore_1.useAuthStore)((state) => state.loggedOut);
    const setLoggedOut = (0, authStore_1.useAuthStore)((state) => state.setLoggedOut);
    const loggingOutRef = (0, react_1.useRef)(false);
    const shouldFetchUser = !loggedOut && (clientSession || !!storeUser);
    const { data: queryUser, isLoading, isFetching, error, refetch, } = (0, react_query_1.useQuery)({
        queryKey: ['user'],
        queryFn: fetchUser,
        enabled: shouldFetchUser,
        staleTime: 15 * 60 * 1000,
        gcTime: 90 * 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        placeholderData: (prev) => prev,
        retry: (failureCount, err) => {
            if (err?.response?.status === 401)
                return false;
            if (err?.response?.status === 429 && failureCount > 1)
                return false;
            return failureCount < 2;
        },
    });
    // Keep store in sync once the server responds; never wipe optimistic user on fetch error.
    (0, react_1.useEffect)(() => {
        if (queryUser) {
            setUser(queryUser);
            setLoggedOut(false);
            queryClient.setQueryData(['user'], queryUser);
        }
    }, [queryUser, setUser, setLoggedOut, queryClient]);
    const cachedUser = queryClient.getQueryData(['user']);
    const user = queryUser ?? storeUser ?? cachedUser ?? null;
    const sessionPending = shouldFetchUser && !user && isLoading;
    const logoutMutation = (0, react_query_1.useMutation)({
        mutationFn: logoutUser,
        onSettled: () => {
            loggingOutRef.current = true;
            setLoggedOut(true);
            resetAuth();
            queryClient.setQueryData(['user'], null);
            queryClient.removeQueries({ queryKey: ['user'] });
            queryClient.clear();
        },
    });
    const logout = async () => {
        loggingOutRef.current = true;
        queryClient.cancelQueries();
        try {
            await logoutMutation.mutateAsync();
        }
        catch {
            setLoggedOut(true);
            resetAuth();
            queryClient.setQueryData(['user'], null);
            queryClient.removeQueries({ queryKey: ['user'] });
            queryClient.clear();
        }
    };
    return {
        user,
        isLoading,
        isFetching,
        error,
        refetch,
        logout,
        isLoggingOut: logoutMutation.isPending,
        sessionPending,
        hasSession: shouldFetchUser,
    };
};
exports.useUser = useUser;
exports.default = useUser;
//# sourceMappingURL=use-user.js.map
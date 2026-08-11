import type { User } from "../interfaces/auth";

const ACCESS_TOKEN = "ACCESS_TOKEN";
const REFRESH_TOKEN = "REFRESH_TOKEN";
const USER = "USER";

export const authStorage = {
    save(access: string, refresh: string, user: User) {
        localStorage.setItem(ACCESS_TOKEN, access);
        localStorage.setItem(REFRESH_TOKEN, refresh);
        localStorage.setItem(USER, JSON.stringify(user));
    },
    updateUser(user: User) {
        localStorage.setItem("USER", JSON.stringify(user));
    },
    clear() {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem(USER);
    },

    getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN);
    },

    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN);
    },

    getUser(): User | null {
        const user = localStorage.getItem(USER);
        return user ? JSON.parse(user) : null;
    },
    updateAccessToken(access: string) {
        localStorage.setItem("ACCESS_TOKEN", access);
    },
    updateRefreshToken(refresh: string) {
        localStorage.setItem(REFRESH_TOKEN, refresh);
    },
};
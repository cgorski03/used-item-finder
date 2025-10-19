import { shouldGetNewToken, setEbayToken } from "../src/ebay-token-utils";
import { getAccessToken } from "@workers/shared";
import { vi, describe, beforeEach, it, expect } from "vitest";

vi.mock("@workers/shared", async () => {
    const actual = await vi.importActual("@workers/shared");
    return {
        ...actual,
        getAccessToken: vi.fn().mockResolvedValue({
            access_token: "new-valid-token",
            expires_in: 7200,
        }),
    };
});

describe("shouldGetNewToken", () => {
    it("should return true for missing token", () => {
        expect(shouldGetNewToken(null)).toBe(true);
        expect(shouldGetNewToken(undefined)).toBe(true);
    });

    it("should return false for valid token with time remaining", () => {
        const validToken = {
            access_token: "valid-token",
            expires_at: Date.now() + 30 * 60 * 1000, // 30 minutes from now
        };
        expect(shouldGetNewToken(validToken)).toBe(false);
    });

    it("should return true for expired token", () => {
        const expiredToken = {
            access_token: "expired-token",
            expires_at: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        };
        expect(shouldGetNewToken(expiredToken)).toBe(true);
    });

    it("should return true for token expiring within buffer", () => {
        const soonExpiring = {
            access_token: "soon-expiring-token",
            expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes (within 15 min buffer)
        };
        expect(shouldGetNewToken(soonExpiring)).toBe(true);
    });
});

describe("setEbayToken", () => {
    const mockCredentials = {
        env: "SANDBOX" as const,
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        devId: "test-dev-id",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should not refresh a valid token", async () => {
        const mockKV = {
            get: vi.fn().mockResolvedValue({
                access_token: "valid-token",
                expires_at: Date.now() + 30 * 60 * 1000,
            }),
            put: vi.fn().mockResolvedValue(undefined),
        } as unknown as KVNamespace;

        await setEbayToken(mockKV, "TOKEN_KEY", mockCredentials);

        expect(mockKV.get).toHaveBeenCalledWith("TOKEN_KEY", { type: "json" });
        expect(mockKV.put).not.toHaveBeenCalled();
        expect(getAccessToken).not.toHaveBeenCalled();
    });

    it("should refresh an expired token", async () => {
        const mockKV = {
            get: vi.fn().mockResolvedValue({
                access_token: "expired-token",
                expires_at: Date.now() - 30 * 60 * 1000,
            }),
            put: vi.fn().mockResolvedValue(undefined),
        } as unknown as KVNamespace;

        await setEbayToken(mockKV, "TOKEN_KEY", mockCredentials);

        expect(mockKV.put).toHaveBeenCalledWith(
            "TOKEN_KEY",
            expect.stringContaining("new-valid-token")
        );
        expect(getAccessToken).toHaveBeenCalledWith(mockCredentials);
    });

    it("should refresh when token is missing", async () => {
        const mockKV = {
            get: vi.fn().mockResolvedValue(null),
            put: vi.fn().mockResolvedValue(undefined),
        } as unknown as KVNamespace;

        await setEbayToken(mockKV, "TOKEN_KEY", mockCredentials);

        expect(mockKV.put).toHaveBeenCalled();
        expect(getAccessToken).toHaveBeenCalledWith(mockCredentials);
    });

    it("should rethrow errors from getAccessToken", async () => {
        const mockKV = {
            get: vi.fn().mockResolvedValue(null),
            put: vi.fn().mockResolvedValue(undefined),
        } as unknown as KVNamespace;

        const mockError = new Error("API error");
        vi.mocked(getAccessToken).mockRejectedValueOnce(mockError);

        await expect(
            setEbayToken(mockKV, "TOKEN_KEY", mockCredentials)
        ).rejects.toThrow("API error");
    });
});

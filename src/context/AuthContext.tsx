"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/firestore-client";

// 管理員 Email 列表
const ADMIN_EMAILS = ['vecear@gmail.com'];

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    userProfile: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    // 獲取用戶 profile
                    let profile = await getUserProfile(currentUser.uid);

                    // 如果用戶沒有 profile 或沒有 role，初始化
                    if (!profile || !profile.role) {
                        const isAdminEmail = ADMIN_EMAILS.includes(currentUser.email || '');
                        const newProfile: UserProfile = {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                            email: currentUser.email || '',
                            photoURL: currentUser.photoURL || undefined,
                            role: isAdminEmail ? 'admin' : 'user',
                            updatedAt: new Date().toISOString()
                        };
                        await updateUserProfile(newProfile);
                        profile = newProfile;
                    }

                    setUserProfile(profile);
                    setIsAdmin(profile.role === 'admin');
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setIsAdmin(false);
                    setUserProfile(null);
                }
            } else {
                setIsAdmin(false);
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, userProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

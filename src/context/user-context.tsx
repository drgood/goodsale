
'use client'
import { createContext, useState, useContext, type ReactNode, useEffect } from "react";
import type { User, Tenant, Sale, Customer } from "@/lib/types";
import { useParams } from "next/navigation";

type UserContextType = {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    tenants: Tenant[];
    setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
    addSale: (sale: Sale) => void;
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
};

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
    const params = useParams();
    const tenantSubdomain = params.tenant as string;
    
    const [users, setUsers] = useState<User[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const addSale = (sale: Sale) => {
        setSales(prev => [sale, ...prev]);
    }

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                // TODO: if you still use UserContext, you can reintroduce tenant-based checks here
                setCurrentUser(parsedUser);
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
        setIsInitialLoad(false);
    }, [tenantSubdomain, tenants]);

    const handleSetCurrentUser = (user: User | null) => {
        setCurrentUser(user);
        if (typeof window !== 'undefined') {
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
            } else {
                localStorage.removeItem('currentUser');
            }
        }
    };
    
    if (isInitialLoad) {
        return null;
    }

    const contextValue = {
        users, setUsers,
        tenants, setTenants,
        sales, setSales, addSale,
        customers, setCustomers,
        currentUser, setCurrentUser: handleSetCurrentUser
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
}

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    return context;
}

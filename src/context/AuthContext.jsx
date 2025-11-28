import { createContext, useContext, useState, useEffect } from 'react';
import { useMockData } from './MockData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const { users } = useMockData();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('hrm_current_user'));
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    const login = (email, password) => {
        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('hrm_current_user', JSON.stringify(foundUser));
            return { success: true };
        }
        return { success: false, message: 'Invalid credentials' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('hrm_current_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

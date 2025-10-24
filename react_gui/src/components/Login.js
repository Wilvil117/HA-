import React, { useState } from 'react';
import authService from '../services/auth_service';
import './Login.css';

const Login = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                await authService.login(email, password);
                onLogin();
            } else {
                await authService.register(email, password);
                setSuccess('Registrasie suksesvol! Jy kan nou in teken.');
                setIsLogin(true); // Switch back to login mode
                setEmail(''); // Clear email
                setPassword(''); // Clear password
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>{isLogin ? 'Teken In' : 'Registreer'}</h2>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">E-pos:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="jou@email.co.za"
                        />
                        <small className="help-text">
                            Admin: eindig met @admin.co.za | Beoordelaar: eindig met @beoordelaar.co.za
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Wagwoord:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Jou wagwoord"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Wag...' : (isLogin ? 'Teken In' : 'Registreer')}
                    </button>
                </form>

                <div className="toggle-mode">
                    <p>
                        {isLogin ? "Nie 'n rekening nie?" : "Reeds 'n rekening?"}
                        <button type="button" onClick={toggleMode} className="toggle-btn">
                            {isLogin ? 'Registreer hier' : 'Teken hier in'}
                        </button>
                    </p>
                </div>

                <div className="demo-accounts">
                    <h4>Demo Rekeninge:</h4>
                    <div className="demo-account">
                        <strong>Admin:</strong> admin@admin.co.za / admin123
                    </div>
                    <div className="demo-account">
                        <strong>Beoordelaar:</strong> beoordelaar@beoordelaar.co.za / beoordelaar123
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

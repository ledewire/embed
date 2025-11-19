import { h } from 'preact';

import { useGoogleLogin } from '@react-oauth/google';

interface LoginModalProps {
    onClose?: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
    const login = useGoogleLogin({
        onSuccess: tokenResponse => console.log(tokenResponse),
        onError: () => console.log('Login Failed'),
    });

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

            {/* Modal */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 relative z-10 mx-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
                <p className="text-gray-600 mb-6">
                    Sign in to access your wallet and purchase this premium content.
                </p>

                {/* Google Button */}
                <button
                    onClick={() => login()}
                    className="w-full border border-gray-300 rounded flex items-center justify-center py-2.5 mb-6 hover:bg-gray-50 transition-colors"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
                    <span className="text-gray-700 font-medium">Continue with Google</span>
                </button>

                <div className="flex items-center mb-6">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="px-3 text-gray-400 text-sm">Or continue with email</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2 uppercase" htmlFor="email">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="appearance-none border border-gray-300 rounded w-full py-3 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 bg-blue-50/30"
                            id="email"
                            type="email"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2 uppercase" htmlFor="password">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="appearance-none border border-gray-300 rounded w-full py-3 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
                            id="password"
                            type="password"
                            required
                        />
                    </div>

                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-colors mb-4"
                        type="submit"
                    >
                        Log In
                    </button>

                    <div className="text-center">
                        <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm font-medium mb-2">
                            Forgot Password?
                        </a>
                        <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Need an account? Sign up
                        </a>
                    </div>
                </form>

                <div className="mt-8 pt-4 border-t border-gray-100 text-center text-gray-400 text-sm">
                    Powered by LedeWire
                </div>
            </div>
        </div>
    );
}

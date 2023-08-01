import React, { useState } from 'react';

interface TwoFactorAuthFormProps {
    isOpen: boolean;
    submit: (code: string) => void;
}

const TwoFactorAuthForm: React.FC<TwoFactorAuthFormProps> = ({ isOpen, submit }) => {
    const [code, setCode] = useState('');

    const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCode(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submit(code);
    };

    return (
        <div
            className={`${isOpen ? 'fixed' : 'hidden'
                } inset-0 flex items-center justify-center z-10`}
        >
            <div className="fixed inset-0 bg-black opacity-60"></div>
            <div className="z-20 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Anthentification á deux facteurs</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="code" className="block font-semibold mb-1">
                            Code d'autentification :
                        </label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            placeholder="Entrez votre code"
                            value={code}
                            onChange={handleCodeChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-trefle-green focus:ring-trefle-green focus:ring-opacity-50"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-trefle-green text-white px-4 py-2 rounded-md"
                        >
                            Valider
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TwoFactorAuthForm;

import React from 'react';
import { useRouter } from "next/router";
import Modal from 'react-modal';
import QRCode from 'qrcode.react';
import fetcher from "../../../../src/utils/fetcher";

interface TwoFactorAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrData: string;
    userID?: bigint;
}

export default function TwoFactorAuthModal({ isOpen, onClose, qrData, userID }: TwoFactorAuthModalProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);
  const [code, setCode] = React.useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const res = await fetcher<string>('/api/2fa/enable', 'POST', {code, userID, token: qrData}).catch((e) => {
          console.error(e);
          setError(e.message);
      });
      if (res) {
        if (res.startsWith('invalid')) return setError('Code invalide');
        console.log(res);
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000);
      }
  }

  return (
      <div className="modal-content flex flex-center flex-col p-1">
        <QRCode className="w-screen" value={`otpauth://totp/Solar?secret=${qrData}&issuer=Le%20Tr%C3%A8fle%202.0`} />
        <p className="modal-text">
          Code manuel :<br/>
          <strong>{qrData}</strong>
        </p>
        <form className="modal-form flex flex-col flex-center" onSubmit={handleSubmit}>
          <label htmlFor="2fa-code" className="modal-label">
            Code A2F
          </label>
          <input id="2fa-code" onChange={
              ({currentTarget:{value}})=>{setCode(value)}
          } className="w-{80%} border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-trefle-green focus:ring-trefle-green focus:ring-opacity-50" type="text" />
          <button className="btn mt-8">Activer</button>
        </form>
        {
            error && <small className="text-red-500">{error}</small>
        }
        {
            success && <small className="text-trefle-green">L'A2F a été activée avec succès !</small>
        }
      </div>
  );
};

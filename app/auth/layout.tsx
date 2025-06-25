import logo from '@/public/auth-bg.png'
import Image from "next/image";

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className='flex justify-around items-center h-screen'>
            <Image src={logo} alt='logo' height={450} className="hidden md:inline absolute bottom-1 left-1 opacity-25"/>
                    {children}
        </div>
    );
}

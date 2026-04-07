import logo from '@/public/auth-bg.png'
import Image from "next/image";

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className='flex justify-center items-center h-svh w-full'>
            <Image src={logo} alt='logo' height={450}
                   className="hidden md:inline absolute bottom-1 left-1 opacity-25 z-0"/>
            <div className="relative z-10 w-full flex justify-center">
                {children}
            </div>
        </div>
    );
}

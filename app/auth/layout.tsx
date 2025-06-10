import {Card} from '@/components/ui/card';
import logo from '@/public/logo.svg'
import Image from "next/image";

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className='flex justify-around items-center h-screen'>

            <Card className="z-50 rounded-3xl max-w-4xl max-h-md p-8">
                <div className="divide-dashed divide-main flex flex-row justify-around items-center">
                    <Image src={logo} alt='logo' height={250}/>
                    {children}
                </div>
            </Card>
        </div>
    );
}

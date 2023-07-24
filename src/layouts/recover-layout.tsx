import Image from 'next/image';
import bg from '../../assets/img/login-bg.png';
import logo from '../../assets/img/logo.png';

export default function RecoverLayout({children} : React.PropsWithChildren<any>){
    return(
        <div className="absolute inset-0 flex items-center justify-center">
            <div className='absolute w-1/3 bottom-5 left-10'>
                <Image src={bg} alt="login-bg" className=""/>
            </div>
            <div className='min-w-200 rounded-4 bg-trefle-light-green drop-shadow-base p-8 flex items-center'>
                <div className="flex-1 flex flex-col items-center">
                    {children}
                </div>
                <div className="w-48 ml-20">
                    <Image src={logo} />
                </div>
            </div>
        </div>
    );
}
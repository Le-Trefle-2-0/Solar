import React from 'react'
import { AppProps } from 'next/app'
import '../assets/stylesheets/globals.scss'
import Router, {useRouter} from "next/router";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import { ReferenceActualEventContextProvider } from '../src/contexts/ReferenceGlobalCHatContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ReferenceActualEventContextProvider>
      <Component {...pageProps} />
    </ReferenceActualEventContextProvider>
  );
}
export default MyApp
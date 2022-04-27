import React from 'react'
import { AppProps } from 'next/app'
import '../assets/stylesheets/globals.scss'
import Router, {useRouter} from "next/router";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import { ReferenceGlobalChatContextProvider } from '../src/contexts/ReferenceGlobalCHatContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ReferenceGlobalChatContextProvider>
      <Component {...pageProps} />
    </ReferenceGlobalChatContextProvider>
  );
}
export default MyApp
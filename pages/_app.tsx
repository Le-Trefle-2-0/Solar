import React from 'react'
import { AppProps } from 'next/app'
import '../assets/stylesheets/globals.scss'
import Router, {useRouter} from "next/router";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthenticatedLayout>
      <Component {...pageProps} />
    </AuthenticatedLayout>
  );
}
export default MyApp
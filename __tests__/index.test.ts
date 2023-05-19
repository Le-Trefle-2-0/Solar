//import '@testing-library/jest'
import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import handleLogin from "../pages/api/auth/login";
import { testApiHandler } from 'next-test-api-route-handler';

(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int || this.toString();
};

describe('Auth', () => {
  it('check auth api url', async () => {

    await testApiHandler({
      handler: handleLogin,
      test: async ({fetch}) => {
        const res = await fetch({
          method: "POST", 
          body: JSON.stringify({
            name: "admin", 
            password: "password"
          })
        });
        // expect(res.status).toBe(200);
        // expect(await res.json()).toEqual(
        //   expect.objectContaining({
        //       jwt: expect.stringMatching(/^[\w-]*\.[\w-]*\.[\w-]*$/),
        //   }),
        // );
      }
    })
  })
})
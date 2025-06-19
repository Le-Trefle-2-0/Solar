
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Public = runtime.Types.Public;
import $Utils = runtime.Types.Utils;
import $Extensions = runtime.Types.Extensions;
import $Result = runtime.Types.Result;

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Session
 * 
 */
export type Session = $Result.DefaultSelection<Prisma.$SessionPayload>
/**
 * Model Account
 * 
 */
export type Account = $Result.DefaultSelection<Prisma.$AccountPayload>
/**
 * Model Verification
 * 
 */
export type Verification = $Result.DefaultSelection<Prisma.$VerificationPayload>
/**
 * Model Organization
 * 
 */
export type Organization = $Result.DefaultSelection<Prisma.$OrganizationPayload>
/**
 * Model Member
 * 
 */
export type Member = $Result.DefaultSelection<Prisma.$MemberPayload>
/**
 * Model Invitation
 * 
 */
export type Invitation = $Result.DefaultSelection<Prisma.$InvitationPayload>
/**
 * Model TwoFactor
 * 
 */
export type TwoFactor = $Result.DefaultSelection<Prisma.$TwoFactorPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.session`: Exposes CRUD operations for the **Session** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sessions
    * const sessions = await prisma.session.findMany()
    * ```
    */
  get session(): Prisma.SessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.account`: Exposes CRUD operations for the **Account** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Accounts
    * const accounts = await prisma.account.findMany()
    * ```
    */
  get account(): Prisma.AccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verification`: Exposes CRUD operations for the **Verification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Verifications
    * const verifications = await prisma.verification.findMany()
    * ```
    */
  get verification(): Prisma.VerificationDelegate<ExtArgs, ClientOptions>;

    /**
     * `prisma.organization`: Exposes CRUD operations for the **Organization** model.
     * Example usage:
     * ```ts
     * // Fetch zero or more Organizations
     * const organizations = await prisma.organization.findMany()
     * ```
     */
    get organization(): Prisma.OrganizationDelegate<ExtArgs, ClientOptions>;

    /**
     * `prisma.member`: Exposes CRUD operations for the **Member** model.
     * Example usage:
     * ```ts
     * // Fetch zero or more Members
     * const members = await prisma.member.findMany()
     * ```
     */
    get member(): Prisma.MemberDelegate<ExtArgs, ClientOptions>;

    /**
     * `prisma.invitation`: Exposes CRUD operations for the **Invitation** model.
     * Example usage:
     * ```ts
     * // Fetch zero or more Invitations
     * const invitations = await prisma.invitation.findMany()
     * ```
     */
    get invitation(): Prisma.InvitationDelegate<ExtArgs, ClientOptions>;

    /**
     * `prisma.twoFactor`: Exposes CRUD operations for the **TwoFactor** model.
     * Example usage:
     * ```ts
     * // Fetch zero or more TwoFactors
     * const twoFactors = await prisma.twoFactor.findMany()
     * ```
     */
    get twoFactor(): Prisma.TwoFactorDelegate<ExtArgs, ClientOptions>;

    /**
     * `prisma.message`: Exposes CRUD operations for the **Message** model.
     * Example usage:
     * ```ts
     * // Fetch zero or more Messages
     * const messages = await prisma.message.findMany()
     * ```
     */
    get message(): Prisma.MessageDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF;
  /**
   * Validator
   */
  export import validator = runtime.Public.validator;
  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError;
  export import PrismaClientValidationError = runtime.PrismaClientValidationError;
  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag;
  export import empty = runtime.empty;
  export import join = runtime.join;
  export import raw = runtime.raw;
  export import Sql = runtime.Sql;
  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal;
  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs;
  export import getExtensionContext = runtime.Extensions.getExtensionContext;
  export import Args = $Public.Args;
  export import Payload = $Public.Payload;
  export import Result = $Public.Result;
  export import Exact = $Public.Exact;
  export import JsonObject = runtime.JsonObject;
  export import JsonArray = runtime.JsonArray;
  export import JsonValue = runtime.JsonValue;
  export import InputJsonObject = runtime.InputJsonObject;
  export import InputJsonArray = runtime.InputJsonArray;
  export import InputJsonValue = runtime.InputJsonValue;

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket


  /**
   * Prisma Client JS version: 6.9.0
   * Query Engine version: 81e4af48011447c3cc503a190e86995b66d2a28e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion


  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Session: 'Session',
    Account: 'Account',
      Verification: 'Verification',
      Organization: 'Organization',
      Member: 'Member',
      Invitation: 'Invitation',
      TwoFactor: 'TwoFactor',
      Message: 'Message'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
        modelProps: "user" | "session" | "account" | "verification" | "organization" | "member" | "invitation" | "twoFactor" | "message"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Session: {
        payload: Prisma.$SessionPayload<ExtArgs>
        fields: Prisma.SessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findFirst: {
            args: Prisma.SessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findMany: {
            args: Prisma.SessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          create: {
            args: Prisma.SessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          createMany: {
            args: Prisma.SessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.SessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          update: {
            args: Prisma.SessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          deleteMany: {
            args: Prisma.SessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          aggregate: {
            args: Prisma.SessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSession>
          }
          groupBy: {
            args: Prisma.SessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SessionCountArgs<ExtArgs>
            result: $Utils.Optional<SessionCountAggregateOutputType> | number
          }
        }
      }
      Account: {
        payload: Prisma.$AccountPayload<ExtArgs>
        fields: Prisma.AccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          findFirst: {
            args: Prisma.AccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          findMany: {
            args: Prisma.AccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[]
          }
          create: {
            args: Prisma.AccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          createMany: {
            args: Prisma.AccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          update: {
            args: Prisma.AccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          deleteMany: {
            args: Prisma.AccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          aggregate: {
            args: Prisma.AccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAccount>
          }
          groupBy: {
            args: Prisma.AccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<AccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.AccountCountArgs<ExtArgs>
            result: $Utils.Optional<AccountCountAggregateOutputType> | number
          }
        }
      }
      Verification: {
        payload: Prisma.$VerificationPayload<ExtArgs>
        fields: Prisma.VerificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          findFirst: {
            args: Prisma.VerificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          findMany: {
            args: Prisma.VerificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>[]
          }
          create: {
            args: Prisma.VerificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          createMany: {
            args: Prisma.VerificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.VerificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          update: {
            args: Prisma.VerificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          deleteMany: {
            args: Prisma.VerificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VerificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationPayload>
          }
          aggregate: {
            args: Prisma.VerificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerification>
          }
          groupBy: {
            args: Prisma.VerificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationCountAggregateOutputType> | number
          }
        }
      }
        Organization: {
            payload: Prisma.$OrganizationPayload<ExtArgs>
            fields: Prisma.OrganizationFieldRefs
            operations: {
                findUnique: {
                    args: Prisma.OrganizationFindUniqueArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload> | null
                }
                findUniqueOrThrow: {
                    args: Prisma.OrganizationFindUniqueOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
                }
                findFirst: {
                    args: Prisma.OrganizationFindFirstArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload> | null
                }
                findFirstOrThrow: {
                    args: Prisma.OrganizationFindFirstOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
                }
                findMany: {
                    args: Prisma.OrganizationFindManyArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>[]
                }
                create: {
                    args: Prisma.OrganizationCreateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
                }
                createMany: {
                    args: Prisma.OrganizationCreateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                delete: {
                    args: Prisma.OrganizationDeleteArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
                }
                update: {
                    args: Prisma.OrganizationUpdateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
                }
                deleteMany: {
                    args: Prisma.OrganizationDeleteManyArgs<ExtArgs>
                    result: BatchPayload
                }
                updateMany: {
                    args: Prisma.OrganizationUpdateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                upsert: {
                    args: Prisma.OrganizationUpsertArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$OrganizationPayload>
                }
                aggregate: {
                    args: Prisma.OrganizationAggregateArgs<ExtArgs>
                    result: $Utils.Optional<AggregateOrganization>
                }
                groupBy: {
                    args: Prisma.OrganizationGroupByArgs<ExtArgs>
                    result: $Utils.Optional<OrganizationGroupByOutputType>[]
                }
                count: {
                    args: Prisma.OrganizationCountArgs<ExtArgs>
                    result: $Utils.Optional<OrganizationCountAggregateOutputType> | number
                }
            }
        }
        Member: {
            payload: Prisma.$MemberPayload<ExtArgs>
            fields: Prisma.MemberFieldRefs
            operations: {
                findUnique: {
                    args: Prisma.MemberFindUniqueArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload> | null
                }
                findUniqueOrThrow: {
                    args: Prisma.MemberFindUniqueOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload>
                }
                findFirst: {
                    args: Prisma.MemberFindFirstArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload> | null
                }
                findFirstOrThrow: {
                    args: Prisma.MemberFindFirstOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload>
                }
                findMany: {
                    args: Prisma.MemberFindManyArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload>[]
                }
                create: {
                    args: Prisma.MemberCreateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload>
                }
                createMany: {
                    args: Prisma.MemberCreateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                delete: {
                    args: Prisma.MemberDeleteArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload>
                }
                update: {
                    args: Prisma.MemberUpdateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload>
                }
                deleteMany: {
                    args: Prisma.MemberDeleteManyArgs<ExtArgs>
                    result: BatchPayload
                }
                updateMany: {
                    args: Prisma.MemberUpdateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                upsert: {
                    args: Prisma.MemberUpsertArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MemberPayload>
                }
                aggregate: {
                    args: Prisma.MemberAggregateArgs<ExtArgs>
                    result: $Utils.Optional<AggregateMember>
                }
                groupBy: {
                    args: Prisma.MemberGroupByArgs<ExtArgs>
                    result: $Utils.Optional<MemberGroupByOutputType>[]
                }
                count: {
                    args: Prisma.MemberCountArgs<ExtArgs>
                    result: $Utils.Optional<MemberCountAggregateOutputType> | number
                }
            }
        }
        Invitation: {
            payload: Prisma.$InvitationPayload<ExtArgs>
            fields: Prisma.InvitationFieldRefs
            operations: {
                findUnique: {
                    args: Prisma.InvitationFindUniqueArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload> | null
                }
                findUniqueOrThrow: {
                    args: Prisma.InvitationFindUniqueOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload>
                }
                findFirst: {
                    args: Prisma.InvitationFindFirstArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload> | null
                }
                findFirstOrThrow: {
                    args: Prisma.InvitationFindFirstOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload>
                }
                findMany: {
                    args: Prisma.InvitationFindManyArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload>[]
                }
                create: {
                    args: Prisma.InvitationCreateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload>
                }
                createMany: {
                    args: Prisma.InvitationCreateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                delete: {
                    args: Prisma.InvitationDeleteArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload>
                }
                update: {
                    args: Prisma.InvitationUpdateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload>
                }
                deleteMany: {
                    args: Prisma.InvitationDeleteManyArgs<ExtArgs>
                    result: BatchPayload
                }
                updateMany: {
                    args: Prisma.InvitationUpdateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                upsert: {
                    args: Prisma.InvitationUpsertArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$InvitationPayload>
                }
                aggregate: {
                    args: Prisma.InvitationAggregateArgs<ExtArgs>
                    result: $Utils.Optional<AggregateInvitation>
                }
                groupBy: {
                    args: Prisma.InvitationGroupByArgs<ExtArgs>
                    result: $Utils.Optional<InvitationGroupByOutputType>[]
                }
                count: {
                    args: Prisma.InvitationCountArgs<ExtArgs>
                    result: $Utils.Optional<InvitationCountAggregateOutputType> | number
                }
            }
        }
        TwoFactor: {
            payload: Prisma.$TwoFactorPayload<ExtArgs>
            fields: Prisma.TwoFactorFieldRefs
            operations: {
                findUnique: {
                    args: Prisma.TwoFactorFindUniqueArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload> | null
                }
                findUniqueOrThrow: {
                    args: Prisma.TwoFactorFindUniqueOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload>
                }
                findFirst: {
                    args: Prisma.TwoFactorFindFirstArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload> | null
                }
                findFirstOrThrow: {
                    args: Prisma.TwoFactorFindFirstOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload>
                }
                findMany: {
                    args: Prisma.TwoFactorFindManyArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload>[]
                }
                create: {
                    args: Prisma.TwoFactorCreateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload>
                }
                createMany: {
                    args: Prisma.TwoFactorCreateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                delete: {
                    args: Prisma.TwoFactorDeleteArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload>
                }
                update: {
                    args: Prisma.TwoFactorUpdateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload>
                }
                deleteMany: {
                    args: Prisma.TwoFactorDeleteManyArgs<ExtArgs>
                    result: BatchPayload
                }
                updateMany: {
                    args: Prisma.TwoFactorUpdateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                upsert: {
                    args: Prisma.TwoFactorUpsertArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$TwoFactorPayload>
                }
                aggregate: {
                    args: Prisma.TwoFactorAggregateArgs<ExtArgs>
                    result: $Utils.Optional<AggregateTwoFactor>
                }
                groupBy: {
                    args: Prisma.TwoFactorGroupByArgs<ExtArgs>
                    result: $Utils.Optional<TwoFactorGroupByOutputType>[]
                }
                count: {
                    args: Prisma.TwoFactorCountArgs<ExtArgs>
                    result: $Utils.Optional<TwoFactorCountAggregateOutputType> | number
                }
            }
        }
        Message: {
            payload: Prisma.$MessagePayload<ExtArgs>
            fields: Prisma.MessageFieldRefs
            operations: {
                findUnique: {
                    args: Prisma.MessageFindUniqueArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
                }
                findUniqueOrThrow: {
                    args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload>
                }
                findFirst: {
                    args: Prisma.MessageFindFirstArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
                }
                findFirstOrThrow: {
                    args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload>
                }
                findMany: {
                    args: Prisma.MessageFindManyArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
                }
                create: {
                    args: Prisma.MessageCreateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload>
                }
                createMany: {
                    args: Prisma.MessageCreateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                delete: {
                    args: Prisma.MessageDeleteArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload>
                }
                update: {
                    args: Prisma.MessageUpdateArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload>
                }
                deleteMany: {
                    args: Prisma.MessageDeleteManyArgs<ExtArgs>
                    result: BatchPayload
                }
                updateMany: {
                    args: Prisma.MessageUpdateManyArgs<ExtArgs>
                    result: BatchPayload
                }
                upsert: {
                    args: Prisma.MessageUpsertArgs<ExtArgs>
                    result: $Utils.PayloadToResult<Prisma.$MessagePayload>
                }
                aggregate: {
                    args: Prisma.MessageAggregateArgs<ExtArgs>
                    result: $Utils.Optional<AggregateMessage>
                }
                groupBy: {
                    args: Prisma.MessageGroupByArgs<ExtArgs>
                    result: $Utils.Optional<MessageGroupByOutputType>[]
                }
                count: {
                    args: Prisma.MessageCountArgs<ExtArgs>
                    result: $Utils.Optional<MessageCountAggregateOutputType> | number
                }
            }
        }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    session?: SessionOmit
    account?: AccountOmit
    verification?: VerificationOmit
      organization?: OrganizationOmit
      member?: MemberOmit
      invitation?: InvitationOmit
      twoFactor?: TwoFactorOmit
      message?: MessageOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    accounts: number
    sessions: number
      messages: number
      members: number
      invitations: number
      twofactors: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | UserCountOutputTypeCountAccountsArgs
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
      messages?: boolean | UserCountOutputTypeCountMessagesArgs
      members?: boolean | UserCountOutputTypeCountMembersArgs
      invitations?: boolean | UserCountOutputTypeCountInvitationsArgs
      twofactors?: boolean | UserCountOutputTypeCountTwofactorsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAccountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
  }

    /**
     * UserCountOutputType without action
     */
    export type UserCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: MessageWhereInput
    }

    /**
     * UserCountOutputType without action
     */
    export type UserCountOutputTypeCountMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: MemberWhereInput
    }

    /**
     * UserCountOutputType without action
     */
    export type UserCountOutputTypeCountInvitationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: InvitationWhereInput
    }

    /**
     * UserCountOutputType without action
     */
    export type UserCountOutputTypeCountTwofactorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: TwoFactorWhereInput
    }


    /**
     * Count Type OrganizationCountOutputType
     */

    export type OrganizationCountOutputType = {
        members: number
        invitations: number
    }

    export type OrganizationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        members?: boolean | OrganizationCountOutputTypeCountMembersArgs
        invitations?: boolean | OrganizationCountOutputTypeCountInvitationsArgs
    }

    // Custom InputTypes
    /**
     * OrganizationCountOutputType without action
     */
    export type OrganizationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the OrganizationCountOutputType
         */
        select?: OrganizationCountOutputTypeSelect<ExtArgs> | null
    }

    /**
     * OrganizationCountOutputType without action
     */
    export type OrganizationCountOutputTypeCountMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: MemberWhereInput
    }

    /**
     * OrganizationCountOutputType without action
     */
    export type OrganizationCountOutputTypeCountInvitationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: InvitationWhereInput
    }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    emailVerified: boolean | null
    image: string | null
    createdAt: Date | null
    updatedAt: Date | null
      role: string | null
      banned: boolean | null
      banReason: string | null
      banExpires: Date | null
      twoFactorEnabled: boolean | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    emailVerified: boolean | null
    image: string | null
    createdAt: Date | null
    updatedAt: Date | null
      role: string | null
      banned: boolean | null
      banReason: string | null
      banExpires: Date | null
      twoFactorEnabled: boolean | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    emailVerified: number
    image: number
    createdAt: number
    updatedAt: number
      role: number
      banned: number
      banReason: number
      banExpires: number
      twoFactorEnabled: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    emailVerified?: true
    image?: true
    createdAt?: true
    updatedAt?: true
      role?: true
      banned?: true
      banReason?: true
      banExpires?: true
      twoFactorEnabled?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    emailVerified?: true
    image?: true
    createdAt?: true
    updatedAt?: true
      role?: true
      banned?: true
      banReason?: true
      banExpires?: true
      twoFactorEnabled?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    emailVerified?: true
    image?: true
    createdAt?: true
    updatedAt?: true
      role?: true
      banned?: true
      banReason?: true
      banExpires?: true
      twoFactorEnabled?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image: string | null
    createdAt: Date
    updatedAt: Date
      role: string | null
      banned: boolean | null
      banReason: string | null
      banExpires: Date | null
      twoFactorEnabled: boolean | null
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    emailVerified?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
      role?: boolean
      banned?: boolean
      banReason?: boolean
      banExpires?: boolean
      twoFactorEnabled?: boolean
    accounts?: boolean | User$accountsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
      messages?: boolean | User$messagesArgs<ExtArgs>
      members?: boolean | User$membersArgs<ExtArgs>
      invitations?: boolean | User$invitationsArgs<ExtArgs>
      twofactors?: boolean | User$twofactorsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>



  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    emailVerified?: boolean
    image?: boolean
    createdAt?: boolean
    updatedAt?: boolean
      role?: boolean
      banned?: boolean
      banReason?: boolean
      banExpires?: boolean
      twoFactorEnabled?: boolean
  }

    export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "emailVerified" | "image" | "createdAt" | "updatedAt" | "role" | "banned" | "banReason" | "banExpires" | "twoFactorEnabled", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | User$accountsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
      messages?: boolean | User$messagesArgs<ExtArgs>
      members?: boolean | User$membersArgs<ExtArgs>
      invitations?: boolean | User$invitationsArgs<ExtArgs>
      twofactors?: boolean | User$twofactorsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      accounts: Prisma.$AccountPayload<ExtArgs>[]
      sessions: Prisma.$SessionPayload<ExtArgs>[]
        messages: Prisma.$MessagePayload<ExtArgs>[]
        members: Prisma.$MemberPayload<ExtArgs>[]
        invitations: Prisma.$InvitationPayload<ExtArgs>[]
        twofactors: Prisma.$TwoFactorPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      email: string
      emailVerified: boolean
      image: string | null
      createdAt: Date
      updatedAt: Date
        role: string | null
        banned: boolean | null
        banReason: string | null
        banExpires: Date | null
        twoFactorEnabled: boolean | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     *
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     *
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     *
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    accounts<T extends User$accountsArgs<ExtArgs> = {}>(args?: Subset<T, User$accountsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>

      messages<T extends User$messagesArgs<ExtArgs> = {}>(args?: Subset<T, User$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>

      members<T extends User$membersArgs<ExtArgs> = {}>(args?: Subset<T, User$membersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>

      invitations<T extends User$invitationsArgs<ExtArgs> = {}>(args?: Subset<T, User$invitationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>

      twofactors<T extends User$twofactorsArgs<ExtArgs> = {}>(args?: Subset<T, User$twofactorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
    readonly image: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
      readonly role: FieldRef<"User", 'String'>
      readonly banned: FieldRef<"User", 'Boolean'>
      readonly banReason: FieldRef<"User", 'String'>
      readonly banExpires: FieldRef<"User", 'DateTime'>
      readonly twoFactorEnabled: FieldRef<"User", 'Boolean'>
  }


    // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.accounts
   */
  export type User$accountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    where?: AccountWhereInput
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    cursor?: AccountWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    cursor?: SessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

    /**
     * User.messages
     */
    export type User$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        where?: MessageWhereInput
        orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
        cursor?: MessageWhereUniqueInput
        take?: number
        skip?: number
        distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
    }

    /**
     * User.members
     */
    export type User$membersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        where?: MemberWhereInput
        orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
        cursor?: MemberWhereUniqueInput
        take?: number
        skip?: number
        distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
    }

    /**
     * User.invitations
     */
    export type User$invitationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        where?: InvitationWhereInput
        orderBy?: InvitationOrderByWithRelationInput | InvitationOrderByWithRelationInput[]
        cursor?: InvitationWhereUniqueInput
        take?: number
        skip?: number
        distinct?: InvitationScalarFieldEnum | InvitationScalarFieldEnum[]
    }

    /**
     * User.twofactors
     */
    export type User$twofactorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        where?: TwoFactorWhereInput
        orderBy?: TwoFactorOrderByWithRelationInput | TwoFactorOrderByWithRelationInput[]
        cursor?: TwoFactorWhereUniqueInput
        take?: number
        skip?: number
        distinct?: TwoFactorScalarFieldEnum | TwoFactorScalarFieldEnum[]
    }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Session
   */

  export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  export type SessionMinAggregateOutputType = {
    id: string | null
    expiresAt: Date | null
    token: string | null
    createdAt: Date | null
    updatedAt: Date | null
    ipAddress: string | null
    userAgent: string | null
    userId: string | null
      impersonatedBy: string | null
      activeOrganizationId: string | null
  }

  export type SessionMaxAggregateOutputType = {
    id: string | null
    expiresAt: Date | null
    token: string | null
    createdAt: Date | null
    updatedAt: Date | null
    ipAddress: string | null
    userAgent: string | null
    userId: string | null
      impersonatedBy: string | null
      activeOrganizationId: string | null
  }

  export type SessionCountAggregateOutputType = {
    id: number
    expiresAt: number
    token: number
    createdAt: number
    updatedAt: number
    ipAddress: number
    userAgent: number
    userId: number
      impersonatedBy: number
      activeOrganizationId: number
    _all: number
  }


  export type SessionMinAggregateInputType = {
    id?: true
    expiresAt?: true
    token?: true
    createdAt?: true
    updatedAt?: true
    ipAddress?: true
    userAgent?: true
    userId?: true
      impersonatedBy?: true
      activeOrganizationId?: true
  }

  export type SessionMaxAggregateInputType = {
    id?: true
    expiresAt?: true
    token?: true
    createdAt?: true
    updatedAt?: true
    ipAddress?: true
    userAgent?: true
    userId?: true
      impersonatedBy?: true
      activeOrganizationId?: true
  }

  export type SessionCountAggregateInputType = {
    id?: true
    expiresAt?: true
    token?: true
    createdAt?: true
    updatedAt?: true
    ipAddress?: true
    userAgent?: true
    userId?: true
      impersonatedBy?: true
      activeOrganizationId?: true
    _all?: true
  }

  export type SessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Session to aggregate.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Sessions
    **/
    _count?: true | SessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: SessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: SessionMaxAggregateInputType
  }

  export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
        [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSession[P]>
      : GetScalarType<T[P], AggregateSession[P]>
  }




  export type SessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithAggregationInput | SessionOrderByWithAggregationInput[]
    by: SessionScalarFieldEnum[] | SessionScalarFieldEnum
    having?: SessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SessionCountAggregateInputType | true
    _min?: SessionMinAggregateInputType
    _max?: SessionMaxAggregateInputType
  }

  export type SessionGroupByOutputType = {
    id: string
    expiresAt: Date
    token: string
    createdAt: Date
    updatedAt: Date
    ipAddress: string | null
    userAgent: string | null
    userId: string
      impersonatedBy: string | null
      activeOrganizationId: string | null
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SessionGroupByOutputType[P]>
            : GetScalarType<T[P], SessionGroupByOutputType[P]>
        }
      >
    >


  export type SessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    expiresAt?: boolean
    token?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    userId?: boolean
      impersonatedBy?: boolean
      activeOrganizationId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>



  export type SessionSelectScalar = {
    id?: boolean
    expiresAt?: boolean
    token?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    userId?: boolean
      impersonatedBy?: boolean
      activeOrganizationId?: boolean
  }

    export type SessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "expiresAt" | "token" | "createdAt" | "updatedAt" | "ipAddress" | "userAgent" | "userId" | "impersonatedBy" | "activeOrganizationId", ExtArgs["result"]["session"]>
  export type SessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Session"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      expiresAt: Date
      token: string
      createdAt: Date
      updatedAt: Date
      ipAddress: string | null
      userAgent: string | null
      userId: string
        impersonatedBy: string | null
        activeOrganizationId: string | null
    }, ExtArgs["result"]["session"]>
    composites: {}
  }

  type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = $Result.GetResult<Prisma.$SessionPayload, S>

  type SessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SessionCountAggregateInputType | true
    }

  export interface SessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Session'], meta: { name: 'Session' } }
    /**
     * Find zero or one Session that matches the filter.
     * @param {SessionFindUniqueArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SessionFindUniqueArgs>(args: SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Session that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SessionFindUniqueOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SessionFindFirstArgs>(args?: SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sessions
     * const sessions = await prisma.session.findMany()
     *
     * // Get first 10 Sessions
     * const sessions = await prisma.session.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const sessionWithIdOnly = await prisma.session.findMany({ select: { id: true } })
     *
     */
    findMany<T extends SessionFindManyArgs>(args?: SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Session.
     * @param {SessionCreateArgs} args - Arguments to create a Session.
     * @example
     * // Create one Session
     * const Session = await prisma.session.create({
     *   data: {
     *     // ... data to create a Session
     *   }
     * })
     *
     */
    create<T extends SessionCreateArgs>(args: SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sessions.
     * @param {SessionCreateManyArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends SessionCreateManyArgs>(args?: SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Session.
     * @param {SessionDeleteArgs} args - Arguments to delete one Session.
     * @example
     * // Delete one Session
     * const Session = await prisma.session.delete({
     *   where: {
     *     // ... filter to delete one Session
     *   }
     * })
     *
     */
    delete<T extends SessionDeleteArgs>(args: SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Session.
     * @param {SessionUpdateArgs} args - Arguments to update one Session.
     * @example
     * // Update one Session
     * const session = await prisma.session.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends SessionUpdateArgs>(args: SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sessions.
     * @param {SessionDeleteManyArgs} args - Arguments to filter Sessions to delete.
     * @example
     * // Delete a few Sessions
     * const { count } = await prisma.session.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends SessionDeleteManyArgs>(args?: SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends SessionUpdateManyArgs>(args: SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Session.
     * @param {SessionUpsertArgs} args - Arguments to update or create a Session.
     * @example
     * // Update or create a Session
     * const session = await prisma.session.upsert({
     *   create: {
     *     // ... data to create a Session
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Session we want to update
     *   }
     * })
     */
    upsert<T extends SessionUpsertArgs>(args: SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionCountArgs} args - Arguments to filter Sessions to count.
     * @example
     * // Count the number of Sessions
     * const count = await prisma.session.count({
     *   where: {
     *     // ... the filter for the Sessions we want to count
     *   }
     * })
    **/
    count<T extends SessionCountArgs>(
      args?: Subset<T, SessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SessionAggregateArgs>(args: Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>

    /**
     * Group by Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends SessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SessionGroupByArgs['orderBy'] }
        : { orderBy?: SessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Session model
   */
  readonly fields: SessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Session.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Session model
   */
  interface SessionFieldRefs {
    readonly id: FieldRef<"Session", 'String'>
    readonly expiresAt: FieldRef<"Session", 'DateTime'>
    readonly token: FieldRef<"Session", 'String'>
    readonly createdAt: FieldRef<"Session", 'DateTime'>
    readonly updatedAt: FieldRef<"Session", 'DateTime'>
    readonly ipAddress: FieldRef<"Session", 'String'>
    readonly userAgent: FieldRef<"Session", 'String'>
    readonly userId: FieldRef<"Session", 'String'>
      readonly impersonatedBy: FieldRef<"Session", 'String'>
      readonly activeOrganizationId: FieldRef<"Session", 'String'>
  }


    // Custom InputTypes
  /**
   * Session findUnique
   */
  export type SessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findUniqueOrThrow
   */
  export type SessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findFirst
   */
  export type SessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findFirstOrThrow
   */
  export type SessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findMany
   */
  export type SessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Sessions to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Sessions.
     */
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session create
   */
  export type SessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to create a Session.
     */
    data: XOR<SessionCreateInput, SessionUncheckedCreateInput>
  }

  /**
   * Session createMany
   */
  export type SessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session update
   */
  export type SessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to update a Session.
     */
    data: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
    /**
     * Choose, which Session to update.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session updateMany
   */
  export type SessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
  }

  /**
   * Session upsert
   */
  export type SessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The filter to search for the Session to update in case it exists.
     */
    where: SessionWhereUniqueInput
    /**
     * In case the Session found by the `where` argument doesn't exist, create a new Session with this data.
     */
    create: XOR<SessionCreateInput, SessionUncheckedCreateInput>
    /**
     * In case the Session was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
  }

  /**
   * Session delete
   */
  export type SessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter which Session to delete.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session deleteMany
   */
  export type SessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sessions to delete
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to delete.
     */
    limit?: number
  }

  /**
   * Session without action
   */
  export type SessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
  }


  /**
   * Model Account
   */

  export type AggregateAccount = {
    _count: AccountCountAggregateOutputType | null
    _min: AccountMinAggregateOutputType | null
    _max: AccountMaxAggregateOutputType | null
  }

  export type AccountMinAggregateOutputType = {
    id: string | null
    accountId: string | null
    providerId: string | null
    userId: string | null
    accessToken: string | null
    refreshToken: string | null
    idToken: string | null
    accessTokenExpiresAt: Date | null
    refreshTokenExpiresAt: Date | null
    scope: string | null
    password: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AccountMaxAggregateOutputType = {
    id: string | null
    accountId: string | null
    providerId: string | null
    userId: string | null
    accessToken: string | null
    refreshToken: string | null
    idToken: string | null
    accessTokenExpiresAt: Date | null
    refreshTokenExpiresAt: Date | null
    scope: string | null
    password: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AccountCountAggregateOutputType = {
    id: number
    accountId: number
    providerId: number
    userId: number
    accessToken: number
    refreshToken: number
    idToken: number
    accessTokenExpiresAt: number
    refreshTokenExpiresAt: number
    scope: number
    password: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AccountMinAggregateInputType = {
    id?: true
    accountId?: true
    providerId?: true
    userId?: true
    accessToken?: true
    refreshToken?: true
    idToken?: true
    accessTokenExpiresAt?: true
    refreshTokenExpiresAt?: true
    scope?: true
    password?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AccountMaxAggregateInputType = {
    id?: true
    accountId?: true
    providerId?: true
    userId?: true
    accessToken?: true
    refreshToken?: true
    idToken?: true
    accessTokenExpiresAt?: true
    refreshTokenExpiresAt?: true
    scope?: true
    password?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AccountCountAggregateInputType = {
    id?: true
    accountId?: true
    providerId?: true
    userId?: true
    accessToken?: true
    refreshToken?: true
    idToken?: true
    accessTokenExpiresAt?: true
    refreshTokenExpiresAt?: true
    scope?: true
    password?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Account to aggregate.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Accounts
    **/
    _count?: true | AccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: AccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: AccountMaxAggregateInputType
  }

  export type GetAccountAggregateType<T extends AccountAggregateArgs> = {
        [P in keyof T & keyof AggregateAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAccount[P]>
      : GetScalarType<T[P], AggregateAccount[P]>
  }




  export type AccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountWhereInput
    orderBy?: AccountOrderByWithAggregationInput | AccountOrderByWithAggregationInput[]
    by: AccountScalarFieldEnum[] | AccountScalarFieldEnum
    having?: AccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AccountCountAggregateInputType | true
    _min?: AccountMinAggregateInputType
    _max?: AccountMaxAggregateInputType
  }

  export type AccountGroupByOutputType = {
    id: string
    accountId: string
    providerId: string
    userId: string
    accessToken: string | null
    refreshToken: string | null
    idToken: string | null
    accessTokenExpiresAt: Date | null
    refreshTokenExpiresAt: Date | null
    scope: string | null
    password: string | null
    createdAt: Date
    updatedAt: Date
    _count: AccountCountAggregateOutputType | null
    _min: AccountMinAggregateOutputType | null
    _max: AccountMaxAggregateOutputType | null
  }

  type GetAccountGroupByPayload<T extends AccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AccountGroupByOutputType[P]>
            : GetScalarType<T[P], AccountGroupByOutputType[P]>
        }
      >
    >


  export type AccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    accountId?: boolean
    providerId?: boolean
    userId?: boolean
    accessToken?: boolean
    refreshToken?: boolean
    idToken?: boolean
    accessTokenExpiresAt?: boolean
    refreshTokenExpiresAt?: boolean
    scope?: boolean
    password?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["account"]>



  export type AccountSelectScalar = {
    id?: boolean
    accountId?: boolean
    providerId?: boolean
    userId?: boolean
    accessToken?: boolean
    refreshToken?: boolean
    idToken?: boolean
    accessTokenExpiresAt?: boolean
    refreshTokenExpiresAt?: boolean
    scope?: boolean
    password?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "accountId" | "providerId" | "userId" | "accessToken" | "refreshToken" | "idToken" | "accessTokenExpiresAt" | "refreshTokenExpiresAt" | "scope" | "password" | "createdAt" | "updatedAt", ExtArgs["result"]["account"]>
  export type AccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $AccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Account"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      accountId: string
      providerId: string
      userId: string
      accessToken: string | null
      refreshToken: string | null
      idToken: string | null
      accessTokenExpiresAt: Date | null
      refreshTokenExpiresAt: Date | null
      scope: string | null
      password: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["account"]>
    composites: {}
  }

  type AccountGetPayload<S extends boolean | null | undefined | AccountDefaultArgs> = $Result.GetResult<Prisma.$AccountPayload, S>

  type AccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AccountCountAggregateInputType | true
    }

  export interface AccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Account'], meta: { name: 'Account' } }
    /**
     * Find zero or one Account that matches the filter.
     * @param {AccountFindUniqueArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AccountFindUniqueArgs>(args: SelectSubset<T, AccountFindUniqueArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Account that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AccountFindUniqueOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AccountFindUniqueOrThrowArgs>(args: SelectSubset<T, AccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Account that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AccountFindFirstArgs>(args?: SelectSubset<T, AccountFindFirstArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Account that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AccountFindFirstOrThrowArgs>(args?: SelectSubset<T, AccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Accounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Accounts
     * const accounts = await prisma.account.findMany()
     *
     * // Get first 10 Accounts
     * const accounts = await prisma.account.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const accountWithIdOnly = await prisma.account.findMany({ select: { id: true } })
     *
     */
    findMany<T extends AccountFindManyArgs>(args?: SelectSubset<T, AccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Account.
     * @param {AccountCreateArgs} args - Arguments to create a Account.
     * @example
     * // Create one Account
     * const Account = await prisma.account.create({
     *   data: {
     *     // ... data to create a Account
     *   }
     * })
     *
     */
    create<T extends AccountCreateArgs>(args: SelectSubset<T, AccountCreateArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Accounts.
     * @param {AccountCreateManyArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const account = await prisma.account.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends AccountCreateManyArgs>(args?: SelectSubset<T, AccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Account.
     * @param {AccountDeleteArgs} args - Arguments to delete one Account.
     * @example
     * // Delete one Account
     * const Account = await prisma.account.delete({
     *   where: {
     *     // ... filter to delete one Account
     *   }
     * })
     *
     */
    delete<T extends AccountDeleteArgs>(args: SelectSubset<T, AccountDeleteArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Account.
     * @param {AccountUpdateArgs} args - Arguments to update one Account.
     * @example
     * // Update one Account
     * const account = await prisma.account.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends AccountUpdateArgs>(args: SelectSubset<T, AccountUpdateArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Accounts.
     * @param {AccountDeleteManyArgs} args - Arguments to filter Accounts to delete.
     * @example
     * // Delete a few Accounts
     * const { count } = await prisma.account.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends AccountDeleteManyArgs>(args?: SelectSubset<T, AccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Accounts
     * const account = await prisma.account.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends AccountUpdateManyArgs>(args: SelectSubset<T, AccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Account.
     * @param {AccountUpsertArgs} args - Arguments to update or create a Account.
     * @example
     * // Update or create a Account
     * const account = await prisma.account.upsert({
     *   create: {
     *     // ... data to create a Account
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Account we want to update
     *   }
     * })
     */
    upsert<T extends AccountUpsertArgs>(args: SelectSubset<T, AccountUpsertArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountCountArgs} args - Arguments to filter Accounts to count.
     * @example
     * // Count the number of Accounts
     * const count = await prisma.account.count({
     *   where: {
     *     // ... the filter for the Accounts we want to count
     *   }
     * })
    **/
    count<T extends AccountCountArgs>(
      args?: Subset<T, AccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AccountAggregateArgs>(args: Subset<T, AccountAggregateArgs>): Prisma.PrismaPromise<GetAccountAggregateType<T>>

    /**
     * Group by Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends AccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AccountGroupByArgs['orderBy'] }
        : { orderBy?: AccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Account model
   */
  readonly fields: AccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Account.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Account model
   */
  interface AccountFieldRefs {
    readonly id: FieldRef<"Account", 'String'>
    readonly accountId: FieldRef<"Account", 'String'>
    readonly providerId: FieldRef<"Account", 'String'>
    readonly userId: FieldRef<"Account", 'String'>
    readonly accessToken: FieldRef<"Account", 'String'>
    readonly refreshToken: FieldRef<"Account", 'String'>
    readonly idToken: FieldRef<"Account", 'String'>
    readonly accessTokenExpiresAt: FieldRef<"Account", 'DateTime'>
    readonly refreshTokenExpiresAt: FieldRef<"Account", 'DateTime'>
    readonly scope: FieldRef<"Account", 'String'>
    readonly password: FieldRef<"Account", 'String'>
    readonly createdAt: FieldRef<"Account", 'DateTime'>
    readonly updatedAt: FieldRef<"Account", 'DateTime'>
  }


    // Custom InputTypes
  /**
   * Account findUnique
   */
  export type AccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account findUniqueOrThrow
   */
  export type AccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account findFirst
   */
  export type AccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account findFirstOrThrow
   */
  export type AccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account findMany
   */
  export type AccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account create
   */
  export type AccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The data needed to create a Account.
     */
    data: XOR<AccountCreateInput, AccountUncheckedCreateInput>
  }

  /**
   * Account createMany
   */
  export type AccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Accounts.
     */
    data: AccountCreateManyInput | AccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Account update
   */
  export type AccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The data needed to update a Account.
     */
    data: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>
    /**
     * Choose, which Account to update.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account updateMany
   */
  export type AccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyInput>
    /**
     * Filter which Accounts to update
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to update.
     */
    limit?: number
  }

  /**
   * Account upsert
   */
  export type AccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The filter to search for the Account to update in case it exists.
     */
    where: AccountWhereUniqueInput
    /**
     * In case the Account found by the `where` argument doesn't exist, create a new Account with this data.
     */
    create: XOR<AccountCreateInput, AccountUncheckedCreateInput>
    /**
     * In case the Account was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>
  }

  /**
   * Account delete
   */
  export type AccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter which Account to delete.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account deleteMany
   */
  export type AccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Accounts to delete
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to delete.
     */
    limit?: number
  }

  /**
   * Account without action
   */
  export type AccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
  }


  /**
   * Model Verification
   */

  export type AggregateVerification = {
    _count: VerificationCountAggregateOutputType | null
    _min: VerificationMinAggregateOutputType | null
    _max: VerificationMaxAggregateOutputType | null
  }

  export type VerificationMinAggregateOutputType = {
    id: string | null
    identifier: string | null
    value: string | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VerificationMaxAggregateOutputType = {
    id: string | null
    identifier: string | null
    value: string | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VerificationCountAggregateOutputType = {
    id: number
    identifier: number
    value: number
    expiresAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VerificationMinAggregateInputType = {
    id?: true
    identifier?: true
    value?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VerificationMaxAggregateInputType = {
    id?: true
    identifier?: true
    value?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VerificationCountAggregateInputType = {
    id?: true
    identifier?: true
    value?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VerificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Verification to aggregate.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Verifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Verifications
    **/
    _count?: true | VerificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: VerificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: VerificationMaxAggregateInputType
  }

  export type GetVerificationAggregateType<T extends VerificationAggregateArgs> = {
        [P in keyof T & keyof AggregateVerification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerification[P]>
      : GetScalarType<T[P], AggregateVerification[P]>
  }




  export type VerificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationWhereInput
    orderBy?: VerificationOrderByWithAggregationInput | VerificationOrderByWithAggregationInput[]
    by: VerificationScalarFieldEnum[] | VerificationScalarFieldEnum
    having?: VerificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationCountAggregateInputType | true
    _min?: VerificationMinAggregateInputType
    _max?: VerificationMaxAggregateInputType
  }

  export type VerificationGroupByOutputType = {
    id: string
    identifier: string
    value: string
    expiresAt: Date
    createdAt: Date | null
    updatedAt: Date | null
    _count: VerificationCountAggregateOutputType | null
    _min: VerificationMinAggregateOutputType | null
    _max: VerificationMaxAggregateOutputType | null
  }

  type GetVerificationGroupByPayload<T extends VerificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationGroupByOutputType[P]>
        }
      >
    >


  export type VerificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    identifier?: boolean
    value?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["verification"]>



  export type VerificationSelectScalar = {
    id?: boolean
    identifier?: boolean
    value?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VerificationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "identifier" | "value" | "expiresAt" | "createdAt" | "updatedAt", ExtArgs["result"]["verification"]>

  export type $VerificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Verification"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      identifier: string
      value: string
      expiresAt: Date
      createdAt: Date | null
      updatedAt: Date | null
    }, ExtArgs["result"]["verification"]>
    composites: {}
  }

  type VerificationGetPayload<S extends boolean | null | undefined | VerificationDefaultArgs> = $Result.GetResult<Prisma.$VerificationPayload, S>

  type VerificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationCountAggregateInputType | true
    }

  export interface VerificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Verification'], meta: { name: 'Verification' } }
    /**
     * Find zero or one Verification that matches the filter.
     * @param {VerificationFindUniqueArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationFindUniqueArgs>(args: SelectSubset<T, VerificationFindUniqueArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Verification that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationFindUniqueOrThrowArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Verification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationFindFirstArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationFindFirstArgs>(args?: SelectSubset<T, VerificationFindFirstArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Verification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationFindFirstOrThrowArgs} args - Arguments to find a Verification
     * @example
     * // Get one Verification
     * const verification = await prisma.verification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Verifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Verifications
     * const verifications = await prisma.verification.findMany()
     *
     * // Get first 10 Verifications
     * const verifications = await prisma.verification.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const verificationWithIdOnly = await prisma.verification.findMany({ select: { id: true } })
     *
     */
    findMany<T extends VerificationFindManyArgs>(args?: SelectSubset<T, VerificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Verification.
     * @param {VerificationCreateArgs} args - Arguments to create a Verification.
     * @example
     * // Create one Verification
     * const Verification = await prisma.verification.create({
     *   data: {
     *     // ... data to create a Verification
     *   }
     * })
     *
     */
    create<T extends VerificationCreateArgs>(args: SelectSubset<T, VerificationCreateArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Verifications.
     * @param {VerificationCreateManyArgs} args - Arguments to create many Verifications.
     * @example
     * // Create many Verifications
     * const verification = await prisma.verification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends VerificationCreateManyArgs>(args?: SelectSubset<T, VerificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Verification.
     * @param {VerificationDeleteArgs} args - Arguments to delete one Verification.
     * @example
     * // Delete one Verification
     * const Verification = await prisma.verification.delete({
     *   where: {
     *     // ... filter to delete one Verification
     *   }
     * })
     *
     */
    delete<T extends VerificationDeleteArgs>(args: SelectSubset<T, VerificationDeleteArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Verification.
     * @param {VerificationUpdateArgs} args - Arguments to update one Verification.
     * @example
     * // Update one Verification
     * const verification = await prisma.verification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends VerificationUpdateArgs>(args: SelectSubset<T, VerificationUpdateArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Verifications.
     * @param {VerificationDeleteManyArgs} args - Arguments to filter Verifications to delete.
     * @example
     * // Delete a few Verifications
     * const { count } = await prisma.verification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends VerificationDeleteManyArgs>(args?: SelectSubset<T, VerificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Verifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Verifications
     * const verification = await prisma.verification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends VerificationUpdateManyArgs>(args: SelectSubset<T, VerificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Verification.
     * @param {VerificationUpsertArgs} args - Arguments to update or create a Verification.
     * @example
     * // Update or create a Verification
     * const verification = await prisma.verification.upsert({
     *   create: {
     *     // ... data to create a Verification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Verification we want to update
     *   }
     * })
     */
    upsert<T extends VerificationUpsertArgs>(args: SelectSubset<T, VerificationUpsertArgs<ExtArgs>>): Prisma__VerificationClient<$Result.GetResult<Prisma.$VerificationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Verifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationCountArgs} args - Arguments to filter Verifications to count.
     * @example
     * // Count the number of Verifications
     * const count = await prisma.verification.count({
     *   where: {
     *     // ... the filter for the Verifications we want to count
     *   }
     * })
    **/
    count<T extends VerificationCountArgs>(
      args?: Subset<T, VerificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Verification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationAggregateArgs>(args: Subset<T, VerificationAggregateArgs>): Prisma.PrismaPromise<GetVerificationAggregateType<T>>

    /**
     * Group by Verification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends VerificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationGroupByArgs['orderBy'] }
        : { orderBy?: VerificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Verification model
   */
  readonly fields: VerificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Verification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Verification model
   */
  interface VerificationFieldRefs {
    readonly id: FieldRef<"Verification", 'String'>
    readonly identifier: FieldRef<"Verification", 'String'>
    readonly value: FieldRef<"Verification", 'String'>
    readonly expiresAt: FieldRef<"Verification", 'DateTime'>
    readonly createdAt: FieldRef<"Verification", 'DateTime'>
    readonly updatedAt: FieldRef<"Verification", 'DateTime'>
  }


    // Custom InputTypes
  /**
   * Verification findUnique
   */
  export type VerificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification findUniqueOrThrow
   */
  export type VerificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification findFirst
   */
  export type VerificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Verifications.
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Verifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Verifications.
     */
    distinct?: VerificationScalarFieldEnum | VerificationScalarFieldEnum[]
  }

  /**
   * Verification findFirstOrThrow
   */
  export type VerificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Filter, which Verification to fetch.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Verifications.
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Verifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Verifications.
     */
    distinct?: VerificationScalarFieldEnum | VerificationScalarFieldEnum[]
  }

  /**
   * Verification findMany
   */
  export type VerificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Filter, which Verifications to fetch.
     */
    where?: VerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Verifications to fetch.
     */
    orderBy?: VerificationOrderByWithRelationInput | VerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Verifications.
     */
    cursor?: VerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Verifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Verifications.
     */
    skip?: number
    distinct?: VerificationScalarFieldEnum | VerificationScalarFieldEnum[]
  }

  /**
   * Verification create
   */
  export type VerificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * The data needed to create a Verification.
     */
    data: XOR<VerificationCreateInput, VerificationUncheckedCreateInput>
  }

  /**
   * Verification createMany
   */
  export type VerificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Verifications.
     */
    data: VerificationCreateManyInput | VerificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Verification update
   */
  export type VerificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * The data needed to update a Verification.
     */
    data: XOR<VerificationUpdateInput, VerificationUncheckedUpdateInput>
    /**
     * Choose, which Verification to update.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification updateMany
   */
  export type VerificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Verifications.
     */
    data: XOR<VerificationUpdateManyMutationInput, VerificationUncheckedUpdateManyInput>
    /**
     * Filter which Verifications to update
     */
    where?: VerificationWhereInput
    /**
     * Limit how many Verifications to update.
     */
    limit?: number
  }

  /**
   * Verification upsert
   */
  export type VerificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * The filter to search for the Verification to update in case it exists.
     */
    where: VerificationWhereUniqueInput
    /**
     * In case the Verification found by the `where` argument doesn't exist, create a new Verification with this data.
     */
    create: XOR<VerificationCreateInput, VerificationUncheckedCreateInput>
    /**
     * In case the Verification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationUpdateInput, VerificationUncheckedUpdateInput>
  }

  /**
   * Verification delete
   */
  export type VerificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
    /**
     * Filter which Verification to delete.
     */
    where: VerificationWhereUniqueInput
  }

  /**
   * Verification deleteMany
   */
  export type VerificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Verifications to delete
     */
    where?: VerificationWhereInput
    /**
     * Limit how many Verifications to delete.
     */
    limit?: number
  }

  /**
   * Verification without action
   */
  export type VerificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Verification
     */
    select?: VerificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Verification
     */
    omit?: VerificationOmit<ExtArgs> | null
  }


    /**
     * Model Organization
     */

    export type AggregateOrganization = {
        _count: OrganizationCountAggregateOutputType | null
        _min: OrganizationMinAggregateOutputType | null
        _max: OrganizationMaxAggregateOutputType | null
    }

    export type OrganizationMinAggregateOutputType = {
        id: string | null
        name: string | null
        slug: string | null
        logo: string | null
        createdAt: Date | null
        metadata: string | null
    }

    export type OrganizationMaxAggregateOutputType = {
        id: string | null
        name: string | null
        slug: string | null
        logo: string | null
        createdAt: Date | null
        metadata: string | null
    }

    export type OrganizationCountAggregateOutputType = {
        id: number
        name: number
        slug: number
        logo: number
        createdAt: number
        metadata: number
        _all: number
    }


    export type OrganizationMinAggregateInputType = {
        id?: true
        name?: true
        slug?: true
        logo?: true
        createdAt?: true
        metadata?: true
    }

    export type OrganizationMaxAggregateInputType = {
        id?: true
        name?: true
        slug?: true
        logo?: true
        createdAt?: true
        metadata?: true
    }

    export type OrganizationCountAggregateInputType = {
        id?: true
        name?: true
        slug?: true
        logo?: true
        createdAt?: true
        metadata?: true
        _all?: true
    }

    export type OrganizationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Organization to aggregate.
         */
        where?: OrganizationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Organizations to fetch.
         */
        orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the start position
         */
        cursor?: OrganizationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Organizations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Organizations.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Count returned Organizations
         **/
        _count?: true | OrganizationCountAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the minimum value
         **/
        _min?: OrganizationMinAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the maximum value
         **/
        _max?: OrganizationMaxAggregateInputType
    }

    export type GetOrganizationAggregateType<T extends OrganizationAggregateArgs> = {
        [P in keyof T & keyof AggregateOrganization]: P extends '_count' | 'count'
            ? T[P] extends true
                ? number
                : GetScalarType<T[P], AggregateOrganization[P]>
            : GetScalarType<T[P], AggregateOrganization[P]>
    }


    export type OrganizationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: OrganizationWhereInput
        orderBy?: OrganizationOrderByWithAggregationInput | OrganizationOrderByWithAggregationInput[]
        by: OrganizationScalarFieldEnum[] | OrganizationScalarFieldEnum
        having?: OrganizationScalarWhereWithAggregatesInput
        take?: number
        skip?: number
        _count?: OrganizationCountAggregateInputType | true
        _min?: OrganizationMinAggregateInputType
        _max?: OrganizationMaxAggregateInputType
    }

    export type OrganizationGroupByOutputType = {
        id: string
        name: string
        slug: string | null
        logo: string | null
        createdAt: Date
        metadata: string | null
        _count: OrganizationCountAggregateOutputType | null
        _min: OrganizationMinAggregateOutputType | null
        _max: OrganizationMaxAggregateOutputType | null
    }

    type GetOrganizationGroupByPayload<T extends OrganizationGroupByArgs> = Prisma.PrismaPromise<
        Array<
            PickEnumerable<OrganizationGroupByOutputType, T['by']> &
            {
                [P in ((keyof T) & (keyof OrganizationGroupByOutputType))]: P extends '_count'
                ? T[P] extends boolean
                    ? number
                    : GetScalarType<T[P], OrganizationGroupByOutputType[P]>
                : GetScalarType<T[P], OrganizationGroupByOutputType[P]>
            }
        >
    >


    export type OrganizationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
        id?: boolean
        name?: boolean
        slug?: boolean
        logo?: boolean
        createdAt?: boolean
        metadata?: boolean
        members?: boolean | Organization$membersArgs<ExtArgs>
        invitations?: boolean | Organization$invitationsArgs<ExtArgs>
        _count?: boolean | OrganizationCountOutputTypeDefaultArgs<ExtArgs>
    }, ExtArgs["result"]["organization"]>


    export type OrganizationSelectScalar = {
        id?: boolean
        name?: boolean
        slug?: boolean
        logo?: boolean
        createdAt?: boolean
        metadata?: boolean
    }

    export type OrganizationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "slug" | "logo" | "createdAt" | "metadata", ExtArgs["result"]["organization"]>
    export type OrganizationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        members?: boolean | Organization$membersArgs<ExtArgs>
        invitations?: boolean | Organization$invitationsArgs<ExtArgs>
        _count?: boolean | OrganizationCountOutputTypeDefaultArgs<ExtArgs>
    }

    export type $OrganizationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        name: "Organization"
        objects: {
            members: Prisma.$MemberPayload<ExtArgs>[]
            invitations: Prisma.$InvitationPayload<ExtArgs>[]
        }
        scalars: $Extensions.GetPayloadResult<{
            id: string
            name: string
            slug: string | null
            logo: string | null
            createdAt: Date
            metadata: string | null
        }, ExtArgs["result"]["organization"]>
        composites: {}
    }

    type OrganizationGetPayload<S extends boolean | null | undefined | OrganizationDefaultArgs> = $Result.GetResult<Prisma.$OrganizationPayload, S>

    type OrganizationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
        Omit<OrganizationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
        select?: OrganizationCountAggregateInputType | true
    }

    export interface OrganizationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
        [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Organization'], meta: { name: 'Organization' } }

        /**
         * Find zero or one Organization that matches the filter.
         * @param {OrganizationFindUniqueArgs} args - Arguments to find a Organization
         * @example
         * // Get one Organization
         * const organization = await prisma.organization.findUnique({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUnique<T extends OrganizationFindUniqueArgs>(args: SelectSubset<T, OrganizationFindUniqueArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find one Organization that matches the filter or throw an error with `error.code='P2025'`
         * if no matches were found.
         * @param {OrganizationFindUniqueOrThrowArgs} args - Arguments to find a Organization
         * @example
         * // Get one Organization
         * const organization = await prisma.organization.findUniqueOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUniqueOrThrow<T extends OrganizationFindUniqueOrThrowArgs>(args: SelectSubset<T, OrganizationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Organization that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {OrganizationFindFirstArgs} args - Arguments to find a Organization
         * @example
         * // Get one Organization
         * const organization = await prisma.organization.findFirst({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirst<T extends OrganizationFindFirstArgs>(args?: SelectSubset<T, OrganizationFindFirstArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Organization that matches the filter or
         * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {OrganizationFindFirstOrThrowArgs} args - Arguments to find a Organization
         * @example
         * // Get one Organization
         * const organization = await prisma.organization.findFirstOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirstOrThrow<T extends OrganizationFindFirstOrThrowArgs>(args?: SelectSubset<T, OrganizationFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find zero or more Organizations that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {OrganizationFindManyArgs} args - Arguments to filter and select certain fields only.
         * @example
         * // Get all Organizations
         * const organizations = await prisma.organization.findMany()
         *
         * // Get first 10 Organizations
         * const organizations = await prisma.organization.findMany({ take: 10 })
         *
         * // Only select the `id`
         * const organizationWithIdOnly = await prisma.organization.findMany({ select: { id: true } })
         *
         */
        findMany<T extends OrganizationFindManyArgs>(args?: SelectSubset<T, OrganizationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

        /**
         * Create a Organization.
         * @param {OrganizationCreateArgs} args - Arguments to create a Organization.
         * @example
         * // Create one Organization
         * const Organization = await prisma.organization.create({
         *   data: {
         *     // ... data to create a Organization
         *   }
         * })
         *
         */
        create<T extends OrganizationCreateArgs>(args: SelectSubset<T, OrganizationCreateArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Create many Organizations.
         * @param {OrganizationCreateManyArgs} args - Arguments to create many Organizations.
         * @example
         * // Create many Organizations
         * const organization = await prisma.organization.createMany({
         *   data: [
         *     // ... provide data here
         *   ]
         * })
         *
         */
        createMany<T extends OrganizationCreateManyArgs>(args?: SelectSubset<T, OrganizationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Delete a Organization.
         * @param {OrganizationDeleteArgs} args - Arguments to delete one Organization.
         * @example
         * // Delete one Organization
         * const Organization = await prisma.organization.delete({
         *   where: {
         *     // ... filter to delete one Organization
         *   }
         * })
         *
         */
        delete<T extends OrganizationDeleteArgs>(args: SelectSubset<T, OrganizationDeleteArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Update one Organization.
         * @param {OrganizationUpdateArgs} args - Arguments to update one Organization.
         * @example
         * // Update one Organization
         * const organization = await prisma.organization.update({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        update<T extends OrganizationUpdateArgs>(args: SelectSubset<T, OrganizationUpdateArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Delete zero or more Organizations.
         * @param {OrganizationDeleteManyArgs} args - Arguments to filter Organizations to delete.
         * @example
         * // Delete a few Organizations
         * const { count } = await prisma.organization.deleteMany({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         *
         */
        deleteMany<T extends OrganizationDeleteManyArgs>(args?: SelectSubset<T, OrganizationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Update zero or more Organizations.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {OrganizationUpdateManyArgs} args - Arguments to update one or more rows.
         * @example
         * // Update many Organizations
         * const organization = await prisma.organization.updateMany({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        updateMany<T extends OrganizationUpdateManyArgs>(args: SelectSubset<T, OrganizationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Create or update one Organization.
         * @param {OrganizationUpsertArgs} args - Arguments to update or create a Organization.
         * @example
         * // Update or create a Organization
         * const organization = await prisma.organization.upsert({
         *   create: {
         *     // ... data to create a Organization
         *   },
         *   update: {
         *     // ... in case it already exists, update
         *   },
         *   where: {
         *     // ... the filter for the Organization we want to update
         *   }
         * })
         */
        upsert<T extends OrganizationUpsertArgs>(args: SelectSubset<T, OrganizationUpsertArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


        /**
         * Count the number of Organizations.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {OrganizationCountArgs} args - Arguments to filter Organizations to count.
         * @example
         * // Count the number of Organizations
         * const count = await prisma.organization.count({
         *   where: {
         *     // ... the filter for the Organizations we want to count
         *   }
         * })
         **/
        count<T extends OrganizationCountArgs>(
            args?: Subset<T, OrganizationCountArgs>,
        ): Prisma.PrismaPromise<
            T extends $Utils.Record<'select', any>
                ? T['select'] extends true
                    ? number
                    : GetScalarType<T['select'], OrganizationCountAggregateOutputType>
                : number
        >

        /**
         * Allows you to perform aggregations operations on a Organization.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {OrganizationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
         * @example
         * // Ordered by age ascending
         * // Where email contains prisma.io
         * // Limited to the 10 users
         * const aggregations = await prisma.user.aggregate({
         *   _avg: {
         *     age: true,
         *   },
         *   where: {
         *     email: {
         *       contains: "prisma.io",
         *     },
         *   },
         *   orderBy: {
         *     age: "asc",
         *   },
         *   take: 10,
         * })
         **/
        aggregate<T extends OrganizationAggregateArgs>(args: Subset<T, OrganizationAggregateArgs>): Prisma.PrismaPromise<GetOrganizationAggregateType<T>>

        /**
         * Group by Organization.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {OrganizationGroupByArgs} args - Group by arguments.
         * @example
         * // Group by city, order by createdAt, get count
         * const result = await prisma.user.groupBy({
         *   by: ['city', 'createdAt'],
         *   orderBy: {
         *     createdAt: true
         *   },
         *   _count: {
         *     _all: true
         *   },
         * })
         *
         **/
        groupBy<
            T extends OrganizationGroupByArgs,
            HasSelectOrTake extends Or<
                Extends<'skip', Keys<T>>,
                Extends<'take', Keys<T>>
            >,
            OrderByArg extends True extends HasSelectOrTake
                ? { orderBy: OrganizationGroupByArgs['orderBy'] }
                : { orderBy?: OrganizationGroupByArgs['orderBy'] },
            OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
            ByFields extends MaybeTupleToUnion<T['by']>,
            ByValid extends Has<ByFields, OrderFields>,
            HavingFields extends GetHavingFields<T['having']>,
            HavingValid extends Has<ByFields, HavingFields>,
            ByEmpty extends T['by'] extends never[] ? True : False,
            InputErrors extends ByEmpty extends True
                ? `Error: "by" must not be empty.`
                : HavingValid extends False
                    ? {
                        [P in HavingFields]: P extends ByFields
                            ? never
                            : P extends string
                                ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                                : [
                                    Error,
                                    'Field ',
                                    P,
                                    ` in "having" needs to be provided in "by"`,
                                ]
                    }[HavingFields]
                    : 'take' extends Keys<T>
                        ? 'orderBy' extends Keys<T>
                            ? ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
                            : 'Error: If you provide "take", you also need to provide "orderBy"'
                        : 'skip' extends Keys<T>
                            ? 'orderBy' extends Keys<T>
                                ? ByValid extends True
                                    ? {}
                                    : {
                                        [P in OrderFields]: P extends ByFields
                                            ? never
                                            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                    }[OrderFields]
                                : 'Error: If you provide "skip", you also need to provide "orderBy"'
                            : ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
        >(args: SubsetIntersection<T, OrganizationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrganizationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

        /**
         * Fields of the Organization model
         */
        readonly fields: OrganizationFieldRefs;
    }

    /**
     * The delegate class that acts as a "Promise-like" for Organization.
     * Why is this prefixed with `Prisma__`?
     * Because we want to prevent naming conflicts as mentioned in
     * https://github.com/prisma/prisma-client-js/issues/707
     */
    export interface Prisma__OrganizationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
        readonly [Symbol.toStringTag]: "PrismaPromise"

        members<T extends Organization$membersArgs<ExtArgs> = {}>(args?: Subset<T, Organization$membersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>

        invitations<T extends Organization$invitationsArgs<ExtArgs> = {}>(args?: Subset<T, Organization$invitationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         * @param onfulfilled The callback to execute when the Promise is resolved.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
         */
        then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>

        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>

        /**
         * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
         * resolved value cannot be modified from the callback.
         * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
         * @returns A Promise for the completion of the callback.
         */
        finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
    }


    /**
     * Fields of the Organization model
     */
    interface OrganizationFieldRefs {
        readonly id: FieldRef<"Organization", 'String'>
        readonly name: FieldRef<"Organization", 'String'>
        readonly slug: FieldRef<"Organization", 'String'>
        readonly logo: FieldRef<"Organization", 'String'>
        readonly createdAt: FieldRef<"Organization", 'DateTime'>
        readonly metadata: FieldRef<"Organization", 'String'>
    }


    // Custom InputTypes
    /**
     * Organization findUnique
     */
    export type OrganizationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * Filter, which Organization to fetch.
         */
        where: OrganizationWhereUniqueInput
    }

    /**
     * Organization findUniqueOrThrow
     */
    export type OrganizationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * Filter, which Organization to fetch.
         */
        where: OrganizationWhereUniqueInput
    }

    /**
     * Organization findFirst
     */
    export type OrganizationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * Filter, which Organization to fetch.
         */
        where?: OrganizationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Organizations to fetch.
         */
        orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Organizations.
         */
        cursor?: OrganizationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Organizations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Organizations.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Organizations.
         */
        distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
    }

    /**
     * Organization findFirstOrThrow
     */
    export type OrganizationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * Filter, which Organization to fetch.
         */
        where?: OrganizationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Organizations to fetch.
         */
        orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Organizations.
         */
        cursor?: OrganizationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Organizations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Organizations.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Organizations.
         */
        distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
    }

    /**
     * Organization findMany
     */
    export type OrganizationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * Filter, which Organizations to fetch.
         */
        where?: OrganizationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Organizations to fetch.
         */
        orderBy?: OrganizationOrderByWithRelationInput | OrganizationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for listing Organizations.
         */
        cursor?: OrganizationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Organizations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Organizations.
         */
        skip?: number
        distinct?: OrganizationScalarFieldEnum | OrganizationScalarFieldEnum[]
    }

    /**
     * Organization create
     */
    export type OrganizationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * The data needed to create a Organization.
         */
        data: XOR<OrganizationCreateInput, OrganizationUncheckedCreateInput>
    }

    /**
     * Organization createMany
     */
    export type OrganizationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to create many Organizations.
         */
        data: OrganizationCreateManyInput | OrganizationCreateManyInput[]
        skipDuplicates?: boolean
    }

    /**
     * Organization update
     */
    export type OrganizationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * The data needed to update a Organization.
         */
        data: XOR<OrganizationUpdateInput, OrganizationUncheckedUpdateInput>
        /**
         * Choose, which Organization to update.
         */
        where: OrganizationWhereUniqueInput
    }

    /**
     * Organization updateMany
     */
    export type OrganizationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to update Organizations.
         */
        data: XOR<OrganizationUpdateManyMutationInput, OrganizationUncheckedUpdateManyInput>
        /**
         * Filter which Organizations to update
         */
        where?: OrganizationWhereInput
        /**
         * Limit how many Organizations to update.
         */
        limit?: number
    }

    /**
     * Organization upsert
     */
    export type OrganizationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * The filter to search for the Organization to update in case it exists.
         */
        where: OrganizationWhereUniqueInput
        /**
         * In case the Organization found by the `where` argument doesn't exist, create a new Organization with this data.
         */
        create: XOR<OrganizationCreateInput, OrganizationUncheckedCreateInput>
        /**
         * In case the Organization was found with the provided `where` argument, update it with this data.
         */
        update: XOR<OrganizationUpdateInput, OrganizationUncheckedUpdateInput>
    }

    /**
     * Organization delete
     */
    export type OrganizationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
        /**
         * Filter which Organization to delete.
         */
        where: OrganizationWhereUniqueInput
    }

    /**
     * Organization deleteMany
     */
    export type OrganizationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Organizations to delete
         */
        where?: OrganizationWhereInput
        /**
         * Limit how many Organizations to delete.
         */
        limit?: number
    }

    /**
     * Organization.members
     */
    export type Organization$membersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        where?: MemberWhereInput
        orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
        cursor?: MemberWhereUniqueInput
        take?: number
        skip?: number
        distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
    }

    /**
     * Organization.invitations
     */
    export type Organization$invitationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        where?: InvitationWhereInput
        orderBy?: InvitationOrderByWithRelationInput | InvitationOrderByWithRelationInput[]
        cursor?: InvitationWhereUniqueInput
        take?: number
        skip?: number
        distinct?: InvitationScalarFieldEnum | InvitationScalarFieldEnum[]
    }

    /**
     * Organization without action
     */
    export type OrganizationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Organization
         */
        select?: OrganizationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Organization
         */
        omit?: OrganizationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: OrganizationInclude<ExtArgs> | null
    }


    /**
     * Model Member
     */

    export type AggregateMember = {
        _count: MemberCountAggregateOutputType | null
        _min: MemberMinAggregateOutputType | null
        _max: MemberMaxAggregateOutputType | null
    }

    export type MemberMinAggregateOutputType = {
        id: string | null
        organizationId: string | null
        userId: string | null
        role: string | null
        createdAt: Date | null
    }

    export type MemberMaxAggregateOutputType = {
        id: string | null
        organizationId: string | null
        userId: string | null
        role: string | null
        createdAt: Date | null
    }

    export type MemberCountAggregateOutputType = {
        id: number
        organizationId: number
        userId: number
        role: number
        createdAt: number
        _all: number
    }


    export type MemberMinAggregateInputType = {
        id?: true
        organizationId?: true
        userId?: true
        role?: true
        createdAt?: true
    }

    export type MemberMaxAggregateInputType = {
        id?: true
        organizationId?: true
        userId?: true
        role?: true
        createdAt?: true
    }

    export type MemberCountAggregateInputType = {
        id?: true
        organizationId?: true
        userId?: true
        role?: true
        createdAt?: true
        _all?: true
    }

    export type MemberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Member to aggregate.
         */
        where?: MemberWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Members to fetch.
         */
        orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the start position
         */
        cursor?: MemberWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Members from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Members.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Count returned Members
         **/
        _count?: true | MemberCountAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the minimum value
         **/
        _min?: MemberMinAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the maximum value
         **/
        _max?: MemberMaxAggregateInputType
    }

    export type GetMemberAggregateType<T extends MemberAggregateArgs> = {
        [P in keyof T & keyof AggregateMember]: P extends '_count' | 'count'
            ? T[P] extends true
                ? number
                : GetScalarType<T[P], AggregateMember[P]>
            : GetScalarType<T[P], AggregateMember[P]>
    }


    export type MemberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: MemberWhereInput
        orderBy?: MemberOrderByWithAggregationInput | MemberOrderByWithAggregationInput[]
        by: MemberScalarFieldEnum[] | MemberScalarFieldEnum
        having?: MemberScalarWhereWithAggregatesInput
        take?: number
        skip?: number
        _count?: MemberCountAggregateInputType | true
        _min?: MemberMinAggregateInputType
        _max?: MemberMaxAggregateInputType
    }

    export type MemberGroupByOutputType = {
        id: string
        organizationId: string
        userId: string
        role: string
        createdAt: Date
        _count: MemberCountAggregateOutputType | null
        _min: MemberMinAggregateOutputType | null
        _max: MemberMaxAggregateOutputType | null
    }

    type GetMemberGroupByPayload<T extends MemberGroupByArgs> = Prisma.PrismaPromise<
        Array<
            PickEnumerable<MemberGroupByOutputType, T['by']> &
            {
                [P in ((keyof T) & (keyof MemberGroupByOutputType))]: P extends '_count'
                ? T[P] extends boolean
                    ? number
                    : GetScalarType<T[P], MemberGroupByOutputType[P]>
                : GetScalarType<T[P], MemberGroupByOutputType[P]>
            }
        >
    >


    export type MemberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
        id?: boolean
        organizationId?: boolean
        userId?: boolean
        role?: boolean
        createdAt?: boolean
        organization?: boolean | OrganizationDefaultArgs<ExtArgs>
        user?: boolean | UserDefaultArgs<ExtArgs>
    }, ExtArgs["result"]["member"]>


    export type MemberSelectScalar = {
        id?: boolean
        organizationId?: boolean
        userId?: boolean
        role?: boolean
        createdAt?: boolean
    }

    export type MemberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "organizationId" | "userId" | "role" | "createdAt", ExtArgs["result"]["member"]>
    export type MemberInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        organization?: boolean | OrganizationDefaultArgs<ExtArgs>
        user?: boolean | UserDefaultArgs<ExtArgs>
    }

    export type $MemberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        name: "Member"
        objects: {
            organization: Prisma.$OrganizationPayload<ExtArgs>
            user: Prisma.$UserPayload<ExtArgs>
        }
        scalars: $Extensions.GetPayloadResult<{
            id: string
            organizationId: string
            userId: string
            role: string
            createdAt: Date
        }, ExtArgs["result"]["member"]>
        composites: {}
    }

    type MemberGetPayload<S extends boolean | null | undefined | MemberDefaultArgs> = $Result.GetResult<Prisma.$MemberPayload, S>

    type MemberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
        Omit<MemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
        select?: MemberCountAggregateInputType | true
    }

    export interface MemberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
        [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Member'], meta: { name: 'Member' } }

        /**
         * Find zero or one Member that matches the filter.
         * @param {MemberFindUniqueArgs} args - Arguments to find a Member
         * @example
         * // Get one Member
         * const member = await prisma.member.findUnique({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUnique<T extends MemberFindUniqueArgs>(args: SelectSubset<T, MemberFindUniqueArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find one Member that matches the filter or throw an error with `error.code='P2025'`
         * if no matches were found.
         * @param {MemberFindUniqueOrThrowArgs} args - Arguments to find a Member
         * @example
         * // Get one Member
         * const member = await prisma.member.findUniqueOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUniqueOrThrow<T extends MemberFindUniqueOrThrowArgs>(args: SelectSubset<T, MemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Member that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MemberFindFirstArgs} args - Arguments to find a Member
         * @example
         * // Get one Member
         * const member = await prisma.member.findFirst({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirst<T extends MemberFindFirstArgs>(args?: SelectSubset<T, MemberFindFirstArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Member that matches the filter or
         * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MemberFindFirstOrThrowArgs} args - Arguments to find a Member
         * @example
         * // Get one Member
         * const member = await prisma.member.findFirstOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirstOrThrow<T extends MemberFindFirstOrThrowArgs>(args?: SelectSubset<T, MemberFindFirstOrThrowArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find zero or more Members that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MemberFindManyArgs} args - Arguments to filter and select certain fields only.
         * @example
         * // Get all Members
         * const members = await prisma.member.findMany()
         *
         * // Get first 10 Members
         * const members = await prisma.member.findMany({ take: 10 })
         *
         * // Only select the `id`
         * const memberWithIdOnly = await prisma.member.findMany({ select: { id: true } })
         *
         */
        findMany<T extends MemberFindManyArgs>(args?: SelectSubset<T, MemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

        /**
         * Create a Member.
         * @param {MemberCreateArgs} args - Arguments to create a Member.
         * @example
         * // Create one Member
         * const Member = await prisma.member.create({
         *   data: {
         *     // ... data to create a Member
         *   }
         * })
         *
         */
        create<T extends MemberCreateArgs>(args: SelectSubset<T, MemberCreateArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Create many Members.
         * @param {MemberCreateManyArgs} args - Arguments to create many Members.
         * @example
         * // Create many Members
         * const member = await prisma.member.createMany({
         *   data: [
         *     // ... provide data here
         *   ]
         * })
         *
         */
        createMany<T extends MemberCreateManyArgs>(args?: SelectSubset<T, MemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Delete a Member.
         * @param {MemberDeleteArgs} args - Arguments to delete one Member.
         * @example
         * // Delete one Member
         * const Member = await prisma.member.delete({
         *   where: {
         *     // ... filter to delete one Member
         *   }
         * })
         *
         */
        delete<T extends MemberDeleteArgs>(args: SelectSubset<T, MemberDeleteArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Update one Member.
         * @param {MemberUpdateArgs} args - Arguments to update one Member.
         * @example
         * // Update one Member
         * const member = await prisma.member.update({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        update<T extends MemberUpdateArgs>(args: SelectSubset<T, MemberUpdateArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Delete zero or more Members.
         * @param {MemberDeleteManyArgs} args - Arguments to filter Members to delete.
         * @example
         * // Delete a few Members
         * const { count } = await prisma.member.deleteMany({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         *
         */
        deleteMany<T extends MemberDeleteManyArgs>(args?: SelectSubset<T, MemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Update zero or more Members.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MemberUpdateManyArgs} args - Arguments to update one or more rows.
         * @example
         * // Update many Members
         * const member = await prisma.member.updateMany({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        updateMany<T extends MemberUpdateManyArgs>(args: SelectSubset<T, MemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Create or update one Member.
         * @param {MemberUpsertArgs} args - Arguments to update or create a Member.
         * @example
         * // Update or create a Member
         * const member = await prisma.member.upsert({
         *   create: {
         *     // ... data to create a Member
         *   },
         *   update: {
         *     // ... in case it already exists, update
         *   },
         *   where: {
         *     // ... the filter for the Member we want to update
         *   }
         * })
         */
        upsert<T extends MemberUpsertArgs>(args: SelectSubset<T, MemberUpsertArgs<ExtArgs>>): Prisma__MemberClient<$Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


        /**
         * Count the number of Members.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MemberCountArgs} args - Arguments to filter Members to count.
         * @example
         * // Count the number of Members
         * const count = await prisma.member.count({
         *   where: {
         *     // ... the filter for the Members we want to count
         *   }
         * })
         **/
        count<T extends MemberCountArgs>(
            args?: Subset<T, MemberCountArgs>,
        ): Prisma.PrismaPromise<
            T extends $Utils.Record<'select', any>
                ? T['select'] extends true
                    ? number
                    : GetScalarType<T['select'], MemberCountAggregateOutputType>
                : number
        >

        /**
         * Allows you to perform aggregations operations on a Member.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
         * @example
         * // Ordered by age ascending
         * // Where email contains prisma.io
         * // Limited to the 10 users
         * const aggregations = await prisma.user.aggregate({
         *   _avg: {
         *     age: true,
         *   },
         *   where: {
         *     email: {
         *       contains: "prisma.io",
         *     },
         *   },
         *   orderBy: {
         *     age: "asc",
         *   },
         *   take: 10,
         * })
         **/
        aggregate<T extends MemberAggregateArgs>(args: Subset<T, MemberAggregateArgs>): Prisma.PrismaPromise<GetMemberAggregateType<T>>

        /**
         * Group by Member.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MemberGroupByArgs} args - Group by arguments.
         * @example
         * // Group by city, order by createdAt, get count
         * const result = await prisma.user.groupBy({
         *   by: ['city', 'createdAt'],
         *   orderBy: {
         *     createdAt: true
         *   },
         *   _count: {
         *     _all: true
         *   },
         * })
         *
         **/
        groupBy<
            T extends MemberGroupByArgs,
            HasSelectOrTake extends Or<
                Extends<'skip', Keys<T>>,
                Extends<'take', Keys<T>>
            >,
            OrderByArg extends True extends HasSelectOrTake
                ? { orderBy: MemberGroupByArgs['orderBy'] }
                : { orderBy?: MemberGroupByArgs['orderBy'] },
            OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
            ByFields extends MaybeTupleToUnion<T['by']>,
            ByValid extends Has<ByFields, OrderFields>,
            HavingFields extends GetHavingFields<T['having']>,
            HavingValid extends Has<ByFields, HavingFields>,
            ByEmpty extends T['by'] extends never[] ? True : False,
            InputErrors extends ByEmpty extends True
                ? `Error: "by" must not be empty.`
                : HavingValid extends False
                    ? {
                        [P in HavingFields]: P extends ByFields
                            ? never
                            : P extends string
                                ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                                : [
                                    Error,
                                    'Field ',
                                    P,
                                    ` in "having" needs to be provided in "by"`,
                                ]
                    }[HavingFields]
                    : 'take' extends Keys<T>
                        ? 'orderBy' extends Keys<T>
                            ? ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
                            : 'Error: If you provide "take", you also need to provide "orderBy"'
                        : 'skip' extends Keys<T>
                            ? 'orderBy' extends Keys<T>
                                ? ByValid extends True
                                    ? {}
                                    : {
                                        [P in OrderFields]: P extends ByFields
                                            ? never
                                            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                    }[OrderFields]
                                : 'Error: If you provide "skip", you also need to provide "orderBy"'
                            : ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
        >(args: SubsetIntersection<T, MemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

        /**
         * Fields of the Member model
         */
        readonly fields: MemberFieldRefs;
    }

    /**
     * The delegate class that acts as a "Promise-like" for Member.
     * Why is this prefixed with `Prisma__`?
     * Because we want to prevent naming conflicts as mentioned in
     * https://github.com/prisma/prisma-client-js/issues/707
     */
    export interface Prisma__MemberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
        readonly [Symbol.toStringTag]: "PrismaPromise"

        organization<T extends OrganizationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OrganizationDefaultArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>

        user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         * @param onfulfilled The callback to execute when the Promise is resolved.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
         */
        then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>

        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>

        /**
         * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
         * resolved value cannot be modified from the callback.
         * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
         * @returns A Promise for the completion of the callback.
         */
        finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
    }


    /**
     * Fields of the Member model
     */
    interface MemberFieldRefs {
        readonly id: FieldRef<"Member", 'String'>
        readonly organizationId: FieldRef<"Member", 'String'>
        readonly userId: FieldRef<"Member", 'String'>
        readonly role: FieldRef<"Member", 'String'>
        readonly createdAt: FieldRef<"Member", 'DateTime'>
    }


    // Custom InputTypes
    /**
     * Member findUnique
     */
    export type MemberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * Filter, which Member to fetch.
         */
        where: MemberWhereUniqueInput
    }

    /**
     * Member findUniqueOrThrow
     */
    export type MemberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * Filter, which Member to fetch.
         */
        where: MemberWhereUniqueInput
    }

    /**
     * Member findFirst
     */
    export type MemberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * Filter, which Member to fetch.
         */
        where?: MemberWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Members to fetch.
         */
        orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Members.
         */
        cursor?: MemberWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Members from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Members.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Members.
         */
        distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
    }

    /**
     * Member findFirstOrThrow
     */
    export type MemberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * Filter, which Member to fetch.
         */
        where?: MemberWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Members to fetch.
         */
        orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Members.
         */
        cursor?: MemberWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Members from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Members.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Members.
         */
        distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
    }

    /**
     * Member findMany
     */
    export type MemberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * Filter, which Members to fetch.
         */
        where?: MemberWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Members to fetch.
         */
        orderBy?: MemberOrderByWithRelationInput | MemberOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for listing Members.
         */
        cursor?: MemberWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Members from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Members.
         */
        skip?: number
        distinct?: MemberScalarFieldEnum | MemberScalarFieldEnum[]
    }

    /**
     * Member create
     */
    export type MemberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * The data needed to create a Member.
         */
        data: XOR<MemberCreateInput, MemberUncheckedCreateInput>
    }

    /**
     * Member createMany
     */
    export type MemberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to create many Members.
         */
        data: MemberCreateManyInput | MemberCreateManyInput[]
        skipDuplicates?: boolean
    }

    /**
     * Member update
     */
    export type MemberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * The data needed to update a Member.
         */
        data: XOR<MemberUpdateInput, MemberUncheckedUpdateInput>
        /**
         * Choose, which Member to update.
         */
        where: MemberWhereUniqueInput
    }

    /**
     * Member updateMany
     */
    export type MemberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to update Members.
         */
        data: XOR<MemberUpdateManyMutationInput, MemberUncheckedUpdateManyInput>
        /**
         * Filter which Members to update
         */
        where?: MemberWhereInput
        /**
         * Limit how many Members to update.
         */
        limit?: number
    }

    /**
     * Member upsert
     */
    export type MemberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * The filter to search for the Member to update in case it exists.
         */
        where: MemberWhereUniqueInput
        /**
         * In case the Member found by the `where` argument doesn't exist, create a new Member with this data.
         */
        create: XOR<MemberCreateInput, MemberUncheckedCreateInput>
        /**
         * In case the Member was found with the provided `where` argument, update it with this data.
         */
        update: XOR<MemberUpdateInput, MemberUncheckedUpdateInput>
    }

    /**
     * Member delete
     */
    export type MemberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
        /**
         * Filter which Member to delete.
         */
        where: MemberWhereUniqueInput
    }

    /**
     * Member deleteMany
     */
    export type MemberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Members to delete
         */
        where?: MemberWhereInput
        /**
         * Limit how many Members to delete.
         */
        limit?: number
    }

    /**
     * Member without action
     */
    export type MemberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Member
         */
        select?: MemberSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Member
         */
        omit?: MemberOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MemberInclude<ExtArgs> | null
    }


    /**
     * Model Invitation
     */

    export type AggregateInvitation = {
        _count: InvitationCountAggregateOutputType | null
        _min: InvitationMinAggregateOutputType | null
        _max: InvitationMaxAggregateOutputType | null
    }

    export type InvitationMinAggregateOutputType = {
        id: string | null
        organizationId: string | null
        email: string | null
        role: string | null
        status: string | null
        expiresAt: Date | null
        inviterId: string | null
    }

    export type InvitationMaxAggregateOutputType = {
        id: string | null
        organizationId: string | null
        email: string | null
        role: string | null
        status: string | null
        expiresAt: Date | null
        inviterId: string | null
    }

    export type InvitationCountAggregateOutputType = {
        id: number
        organizationId: number
        email: number
        role: number
        status: number
        expiresAt: number
        inviterId: number
        _all: number
    }


    export type InvitationMinAggregateInputType = {
        id?: true
        organizationId?: true
        email?: true
        role?: true
        status?: true
        expiresAt?: true
        inviterId?: true
    }

    export type InvitationMaxAggregateInputType = {
        id?: true
        organizationId?: true
        email?: true
        role?: true
        status?: true
        expiresAt?: true
        inviterId?: true
    }

    export type InvitationCountAggregateInputType = {
        id?: true
        organizationId?: true
        email?: true
        role?: true
        status?: true
        expiresAt?: true
        inviterId?: true
        _all?: true
    }

    export type InvitationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Invitation to aggregate.
         */
        where?: InvitationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Invitations to fetch.
         */
        orderBy?: InvitationOrderByWithRelationInput | InvitationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the start position
         */
        cursor?: InvitationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Invitations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Invitations.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Count returned Invitations
         **/
        _count?: true | InvitationCountAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the minimum value
         **/
        _min?: InvitationMinAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the maximum value
         **/
        _max?: InvitationMaxAggregateInputType
    }

    export type GetInvitationAggregateType<T extends InvitationAggregateArgs> = {
        [P in keyof T & keyof AggregateInvitation]: P extends '_count' | 'count'
            ? T[P] extends true
                ? number
                : GetScalarType<T[P], AggregateInvitation[P]>
            : GetScalarType<T[P], AggregateInvitation[P]>
    }


    export type InvitationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: InvitationWhereInput
        orderBy?: InvitationOrderByWithAggregationInput | InvitationOrderByWithAggregationInput[]
        by: InvitationScalarFieldEnum[] | InvitationScalarFieldEnum
        having?: InvitationScalarWhereWithAggregatesInput
        take?: number
        skip?: number
        _count?: InvitationCountAggregateInputType | true
        _min?: InvitationMinAggregateInputType
        _max?: InvitationMaxAggregateInputType
    }

    export type InvitationGroupByOutputType = {
        id: string
        organizationId: string
        email: string
        role: string | null
        status: string
        expiresAt: Date
        inviterId: string
        _count: InvitationCountAggregateOutputType | null
        _min: InvitationMinAggregateOutputType | null
        _max: InvitationMaxAggregateOutputType | null
    }

    type GetInvitationGroupByPayload<T extends InvitationGroupByArgs> = Prisma.PrismaPromise<
        Array<
            PickEnumerable<InvitationGroupByOutputType, T['by']> &
            {
                [P in ((keyof T) & (keyof InvitationGroupByOutputType))]: P extends '_count'
                ? T[P] extends boolean
                    ? number
                    : GetScalarType<T[P], InvitationGroupByOutputType[P]>
                : GetScalarType<T[P], InvitationGroupByOutputType[P]>
            }
        >
    >


    export type InvitationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
        id?: boolean
        organizationId?: boolean
        email?: boolean
        role?: boolean
        status?: boolean
        expiresAt?: boolean
        inviterId?: boolean
        organization?: boolean | OrganizationDefaultArgs<ExtArgs>
        user?: boolean | UserDefaultArgs<ExtArgs>
    }, ExtArgs["result"]["invitation"]>


    export type InvitationSelectScalar = {
        id?: boolean
        organizationId?: boolean
        email?: boolean
        role?: boolean
        status?: boolean
        expiresAt?: boolean
        inviterId?: boolean
    }

    export type InvitationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "organizationId" | "email" | "role" | "status" | "expiresAt" | "inviterId", ExtArgs["result"]["invitation"]>
    export type InvitationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        organization?: boolean | OrganizationDefaultArgs<ExtArgs>
        user?: boolean | UserDefaultArgs<ExtArgs>
    }

    export type $InvitationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        name: "Invitation"
        objects: {
            organization: Prisma.$OrganizationPayload<ExtArgs>
            user: Prisma.$UserPayload<ExtArgs>
        }
        scalars: $Extensions.GetPayloadResult<{
            id: string
            organizationId: string
            email: string
            role: string | null
            status: string
            expiresAt: Date
            inviterId: string
        }, ExtArgs["result"]["invitation"]>
        composites: {}
    }

    type InvitationGetPayload<S extends boolean | null | undefined | InvitationDefaultArgs> = $Result.GetResult<Prisma.$InvitationPayload, S>

    type InvitationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
        Omit<InvitationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
        select?: InvitationCountAggregateInputType | true
    }

    export interface InvitationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
        [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Invitation'], meta: { name: 'Invitation' } }

        /**
         * Find zero or one Invitation that matches the filter.
         * @param {InvitationFindUniqueArgs} args - Arguments to find a Invitation
         * @example
         * // Get one Invitation
         * const invitation = await prisma.invitation.findUnique({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUnique<T extends InvitationFindUniqueArgs>(args: SelectSubset<T, InvitationFindUniqueArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find one Invitation that matches the filter or throw an error with `error.code='P2025'`
         * if no matches were found.
         * @param {InvitationFindUniqueOrThrowArgs} args - Arguments to find a Invitation
         * @example
         * // Get one Invitation
         * const invitation = await prisma.invitation.findUniqueOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUniqueOrThrow<T extends InvitationFindUniqueOrThrowArgs>(args: SelectSubset<T, InvitationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Invitation that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {InvitationFindFirstArgs} args - Arguments to find a Invitation
         * @example
         * // Get one Invitation
         * const invitation = await prisma.invitation.findFirst({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirst<T extends InvitationFindFirstArgs>(args?: SelectSubset<T, InvitationFindFirstArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Invitation that matches the filter or
         * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {InvitationFindFirstOrThrowArgs} args - Arguments to find a Invitation
         * @example
         * // Get one Invitation
         * const invitation = await prisma.invitation.findFirstOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirstOrThrow<T extends InvitationFindFirstOrThrowArgs>(args?: SelectSubset<T, InvitationFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find zero or more Invitations that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {InvitationFindManyArgs} args - Arguments to filter and select certain fields only.
         * @example
         * // Get all Invitations
         * const invitations = await prisma.invitation.findMany()
         *
         * // Get first 10 Invitations
         * const invitations = await prisma.invitation.findMany({ take: 10 })
         *
         * // Only select the `id`
         * const invitationWithIdOnly = await prisma.invitation.findMany({ select: { id: true } })
         *
         */
        findMany<T extends InvitationFindManyArgs>(args?: SelectSubset<T, InvitationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

        /**
         * Create a Invitation.
         * @param {InvitationCreateArgs} args - Arguments to create a Invitation.
         * @example
         * // Create one Invitation
         * const Invitation = await prisma.invitation.create({
         *   data: {
         *     // ... data to create a Invitation
         *   }
         * })
         *
         */
        create<T extends InvitationCreateArgs>(args: SelectSubset<T, InvitationCreateArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Create many Invitations.
         * @param {InvitationCreateManyArgs} args - Arguments to create many Invitations.
         * @example
         * // Create many Invitations
         * const invitation = await prisma.invitation.createMany({
         *   data: [
         *     // ... provide data here
         *   ]
         * })
         *
         */
        createMany<T extends InvitationCreateManyArgs>(args?: SelectSubset<T, InvitationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Delete a Invitation.
         * @param {InvitationDeleteArgs} args - Arguments to delete one Invitation.
         * @example
         * // Delete one Invitation
         * const Invitation = await prisma.invitation.delete({
         *   where: {
         *     // ... filter to delete one Invitation
         *   }
         * })
         *
         */
        delete<T extends InvitationDeleteArgs>(args: SelectSubset<T, InvitationDeleteArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Update one Invitation.
         * @param {InvitationUpdateArgs} args - Arguments to update one Invitation.
         * @example
         * // Update one Invitation
         * const invitation = await prisma.invitation.update({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        update<T extends InvitationUpdateArgs>(args: SelectSubset<T, InvitationUpdateArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Delete zero or more Invitations.
         * @param {InvitationDeleteManyArgs} args - Arguments to filter Invitations to delete.
         * @example
         * // Delete a few Invitations
         * const { count } = await prisma.invitation.deleteMany({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         *
         */
        deleteMany<T extends InvitationDeleteManyArgs>(args?: SelectSubset<T, InvitationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Update zero or more Invitations.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {InvitationUpdateManyArgs} args - Arguments to update one or more rows.
         * @example
         * // Update many Invitations
         * const invitation = await prisma.invitation.updateMany({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        updateMany<T extends InvitationUpdateManyArgs>(args: SelectSubset<T, InvitationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Create or update one Invitation.
         * @param {InvitationUpsertArgs} args - Arguments to update or create a Invitation.
         * @example
         * // Update or create a Invitation
         * const invitation = await prisma.invitation.upsert({
         *   create: {
         *     // ... data to create a Invitation
         *   },
         *   update: {
         *     // ... in case it already exists, update
         *   },
         *   where: {
         *     // ... the filter for the Invitation we want to update
         *   }
         * })
         */
        upsert<T extends InvitationUpsertArgs>(args: SelectSubset<T, InvitationUpsertArgs<ExtArgs>>): Prisma__InvitationClient<$Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


        /**
         * Count the number of Invitations.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {InvitationCountArgs} args - Arguments to filter Invitations to count.
         * @example
         * // Count the number of Invitations
         * const count = await prisma.invitation.count({
         *   where: {
         *     // ... the filter for the Invitations we want to count
         *   }
         * })
         **/
        count<T extends InvitationCountArgs>(
            args?: Subset<T, InvitationCountArgs>,
        ): Prisma.PrismaPromise<
            T extends $Utils.Record<'select', any>
                ? T['select'] extends true
                    ? number
                    : GetScalarType<T['select'], InvitationCountAggregateOutputType>
                : number
        >

        /**
         * Allows you to perform aggregations operations on a Invitation.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {InvitationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
         * @example
         * // Ordered by age ascending
         * // Where email contains prisma.io
         * // Limited to the 10 users
         * const aggregations = await prisma.user.aggregate({
         *   _avg: {
         *     age: true,
         *   },
         *   where: {
         *     email: {
         *       contains: "prisma.io",
         *     },
         *   },
         *   orderBy: {
         *     age: "asc",
         *   },
         *   take: 10,
         * })
         **/
        aggregate<T extends InvitationAggregateArgs>(args: Subset<T, InvitationAggregateArgs>): Prisma.PrismaPromise<GetInvitationAggregateType<T>>

        /**
         * Group by Invitation.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {InvitationGroupByArgs} args - Group by arguments.
         * @example
         * // Group by city, order by createdAt, get count
         * const result = await prisma.user.groupBy({
         *   by: ['city', 'createdAt'],
         *   orderBy: {
         *     createdAt: true
         *   },
         *   _count: {
         *     _all: true
         *   },
         * })
         *
         **/
        groupBy<
            T extends InvitationGroupByArgs,
            HasSelectOrTake extends Or<
                Extends<'skip', Keys<T>>,
                Extends<'take', Keys<T>>
            >,
            OrderByArg extends True extends HasSelectOrTake
                ? { orderBy: InvitationGroupByArgs['orderBy'] }
                : { orderBy?: InvitationGroupByArgs['orderBy'] },
            OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
            ByFields extends MaybeTupleToUnion<T['by']>,
            ByValid extends Has<ByFields, OrderFields>,
            HavingFields extends GetHavingFields<T['having']>,
            HavingValid extends Has<ByFields, HavingFields>,
            ByEmpty extends T['by'] extends never[] ? True : False,
            InputErrors extends ByEmpty extends True
                ? `Error: "by" must not be empty.`
                : HavingValid extends False
                    ? {
                        [P in HavingFields]: P extends ByFields
                            ? never
                            : P extends string
                                ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                                : [
                                    Error,
                                    'Field ',
                                    P,
                                    ` in "having" needs to be provided in "by"`,
                                ]
                    }[HavingFields]
                    : 'take' extends Keys<T>
                        ? 'orderBy' extends Keys<T>
                            ? ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
                            : 'Error: If you provide "take", you also need to provide "orderBy"'
                        : 'skip' extends Keys<T>
                            ? 'orderBy' extends Keys<T>
                                ? ByValid extends True
                                    ? {}
                                    : {
                                        [P in OrderFields]: P extends ByFields
                                            ? never
                                            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                    }[OrderFields]
                                : 'Error: If you provide "skip", you also need to provide "orderBy"'
                            : ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
        >(args: SubsetIntersection<T, InvitationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvitationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

        /**
         * Fields of the Invitation model
         */
        readonly fields: InvitationFieldRefs;
    }

    /**
     * The delegate class that acts as a "Promise-like" for Invitation.
     * Why is this prefixed with `Prisma__`?
     * Because we want to prevent naming conflicts as mentioned in
     * https://github.com/prisma/prisma-client-js/issues/707
     */
    export interface Prisma__InvitationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
        readonly [Symbol.toStringTag]: "PrismaPromise"

        organization<T extends OrganizationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, OrganizationDefaultArgs<ExtArgs>>): Prisma__OrganizationClient<$Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>

        user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         * @param onfulfilled The callback to execute when the Promise is resolved.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
         */
        then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>

        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>

        /**
         * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
         * resolved value cannot be modified from the callback.
         * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
         * @returns A Promise for the completion of the callback.
         */
        finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
    }


    /**
     * Fields of the Invitation model
     */
    interface InvitationFieldRefs {
        readonly id: FieldRef<"Invitation", 'String'>
        readonly organizationId: FieldRef<"Invitation", 'String'>
        readonly email: FieldRef<"Invitation", 'String'>
        readonly role: FieldRef<"Invitation", 'String'>
        readonly status: FieldRef<"Invitation", 'String'>
        readonly expiresAt: FieldRef<"Invitation", 'DateTime'>
        readonly inviterId: FieldRef<"Invitation", 'String'>
    }


    // Custom InputTypes
    /**
     * Invitation findUnique
     */
    export type InvitationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * Filter, which Invitation to fetch.
         */
        where: InvitationWhereUniqueInput
    }

    /**
     * Invitation findUniqueOrThrow
     */
    export type InvitationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * Filter, which Invitation to fetch.
         */
        where: InvitationWhereUniqueInput
    }

    /**
     * Invitation findFirst
     */
    export type InvitationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * Filter, which Invitation to fetch.
         */
        where?: InvitationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Invitations to fetch.
         */
        orderBy?: InvitationOrderByWithRelationInput | InvitationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Invitations.
         */
        cursor?: InvitationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Invitations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Invitations.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Invitations.
         */
        distinct?: InvitationScalarFieldEnum | InvitationScalarFieldEnum[]
    }

    /**
     * Invitation findFirstOrThrow
     */
    export type InvitationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * Filter, which Invitation to fetch.
         */
        where?: InvitationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Invitations to fetch.
         */
        orderBy?: InvitationOrderByWithRelationInput | InvitationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Invitations.
         */
        cursor?: InvitationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Invitations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Invitations.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Invitations.
         */
        distinct?: InvitationScalarFieldEnum | InvitationScalarFieldEnum[]
    }

    /**
     * Invitation findMany
     */
    export type InvitationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * Filter, which Invitations to fetch.
         */
        where?: InvitationWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Invitations to fetch.
         */
        orderBy?: InvitationOrderByWithRelationInput | InvitationOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for listing Invitations.
         */
        cursor?: InvitationWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Invitations from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Invitations.
         */
        skip?: number
        distinct?: InvitationScalarFieldEnum | InvitationScalarFieldEnum[]
    }

    /**
     * Invitation create
     */
    export type InvitationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * The data needed to create a Invitation.
         */
        data: XOR<InvitationCreateInput, InvitationUncheckedCreateInput>
    }

    /**
     * Invitation createMany
     */
    export type InvitationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to create many Invitations.
         */
        data: InvitationCreateManyInput | InvitationCreateManyInput[]
        skipDuplicates?: boolean
    }

    /**
     * Invitation update
     */
    export type InvitationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * The data needed to update a Invitation.
         */
        data: XOR<InvitationUpdateInput, InvitationUncheckedUpdateInput>
        /**
         * Choose, which Invitation to update.
         */
        where: InvitationWhereUniqueInput
    }

    /**
     * Invitation updateMany
     */
    export type InvitationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to update Invitations.
         */
        data: XOR<InvitationUpdateManyMutationInput, InvitationUncheckedUpdateManyInput>
        /**
         * Filter which Invitations to update
         */
        where?: InvitationWhereInput
        /**
         * Limit how many Invitations to update.
         */
        limit?: number
    }

    /**
     * Invitation upsert
     */
    export type InvitationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * The filter to search for the Invitation to update in case it exists.
         */
        where: InvitationWhereUniqueInput
        /**
         * In case the Invitation found by the `where` argument doesn't exist, create a new Invitation with this data.
         */
        create: XOR<InvitationCreateInput, InvitationUncheckedCreateInput>
        /**
         * In case the Invitation was found with the provided `where` argument, update it with this data.
         */
        update: XOR<InvitationUpdateInput, InvitationUncheckedUpdateInput>
    }

    /**
     * Invitation delete
     */
    export type InvitationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
        /**
         * Filter which Invitation to delete.
         */
        where: InvitationWhereUniqueInput
    }

    /**
     * Invitation deleteMany
     */
    export type InvitationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Invitations to delete
         */
        where?: InvitationWhereInput
        /**
         * Limit how many Invitations to delete.
         */
        limit?: number
    }

    /**
     * Invitation without action
     */
    export type InvitationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Invitation
         */
        select?: InvitationSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Invitation
         */
        omit?: InvitationOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: InvitationInclude<ExtArgs> | null
    }


    /**
     * Model TwoFactor
     */

    export type AggregateTwoFactor = {
        _count: TwoFactorCountAggregateOutputType | null
        _min: TwoFactorMinAggregateOutputType | null
        _max: TwoFactorMaxAggregateOutputType | null
    }

    export type TwoFactorMinAggregateOutputType = {
        id: string | null
        secret: string | null
        backupCodes: string | null
        userId: string | null
    }

    export type TwoFactorMaxAggregateOutputType = {
        id: string | null
        secret: string | null
        backupCodes: string | null
        userId: string | null
    }

    export type TwoFactorCountAggregateOutputType = {
        id: number
        secret: number
        backupCodes: number
        userId: number
        _all: number
    }


    export type TwoFactorMinAggregateInputType = {
        id?: true
        secret?: true
        backupCodes?: true
        userId?: true
    }

    export type TwoFactorMaxAggregateInputType = {
        id?: true
        secret?: true
        backupCodes?: true
        userId?: true
    }

    export type TwoFactorCountAggregateInputType = {
        id?: true
        secret?: true
        backupCodes?: true
        userId?: true
        _all?: true
    }

    export type TwoFactorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which TwoFactor to aggregate.
         */
        where?: TwoFactorWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of TwoFactors to fetch.
         */
        orderBy?: TwoFactorOrderByWithRelationInput | TwoFactorOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the start position
         */
        cursor?: TwoFactorWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` TwoFactors from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` TwoFactors.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Count returned TwoFactors
         **/
        _count?: true | TwoFactorCountAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the minimum value
         **/
        _min?: TwoFactorMinAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the maximum value
         **/
        _max?: TwoFactorMaxAggregateInputType
    }

    export type GetTwoFactorAggregateType<T extends TwoFactorAggregateArgs> = {
        [P in keyof T & keyof AggregateTwoFactor]: P extends '_count' | 'count'
            ? T[P] extends true
                ? number
                : GetScalarType<T[P], AggregateTwoFactor[P]>
            : GetScalarType<T[P], AggregateTwoFactor[P]>
    }


    export type TwoFactorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: TwoFactorWhereInput
        orderBy?: TwoFactorOrderByWithAggregationInput | TwoFactorOrderByWithAggregationInput[]
        by: TwoFactorScalarFieldEnum[] | TwoFactorScalarFieldEnum
        having?: TwoFactorScalarWhereWithAggregatesInput
        take?: number
        skip?: number
        _count?: TwoFactorCountAggregateInputType | true
        _min?: TwoFactorMinAggregateInputType
        _max?: TwoFactorMaxAggregateInputType
    }

    export type TwoFactorGroupByOutputType = {
        id: string
        secret: string
        backupCodes: string
        userId: string
        _count: TwoFactorCountAggregateOutputType | null
        _min: TwoFactorMinAggregateOutputType | null
        _max: TwoFactorMaxAggregateOutputType | null
    }

    type GetTwoFactorGroupByPayload<T extends TwoFactorGroupByArgs> = Prisma.PrismaPromise<
        Array<
            PickEnumerable<TwoFactorGroupByOutputType, T['by']> &
            {
                [P in ((keyof T) & (keyof TwoFactorGroupByOutputType))]: P extends '_count'
                ? T[P] extends boolean
                    ? number
                    : GetScalarType<T[P], TwoFactorGroupByOutputType[P]>
                : GetScalarType<T[P], TwoFactorGroupByOutputType[P]>
            }
        >
    >


    export type TwoFactorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
        id?: boolean
        secret?: boolean
        backupCodes?: boolean
        userId?: boolean
        user?: boolean | UserDefaultArgs<ExtArgs>
    }, ExtArgs["result"]["twoFactor"]>


    export type TwoFactorSelectScalar = {
        id?: boolean
        secret?: boolean
        backupCodes?: boolean
        userId?: boolean
    }

    export type TwoFactorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "secret" | "backupCodes" | "userId", ExtArgs["result"]["twoFactor"]>
    export type TwoFactorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        user?: boolean | UserDefaultArgs<ExtArgs>
    }

    export type $TwoFactorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        name: "TwoFactor"
        objects: {
            user: Prisma.$UserPayload<ExtArgs>
        }
        scalars: $Extensions.GetPayloadResult<{
            id: string
            secret: string
            backupCodes: string
            userId: string
        }, ExtArgs["result"]["twoFactor"]>
        composites: {}
    }

    type TwoFactorGetPayload<S extends boolean | null | undefined | TwoFactorDefaultArgs> = $Result.GetResult<Prisma.$TwoFactorPayload, S>

    type TwoFactorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
        Omit<TwoFactorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
        select?: TwoFactorCountAggregateInputType | true
    }

    export interface TwoFactorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
        [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TwoFactor'], meta: { name: 'TwoFactor' } }

        /**
         * Find zero or one TwoFactor that matches the filter.
         * @param {TwoFactorFindUniqueArgs} args - Arguments to find a TwoFactor
         * @example
         * // Get one TwoFactor
         * const twoFactor = await prisma.twoFactor.findUnique({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUnique<T extends TwoFactorFindUniqueArgs>(args: SelectSubset<T, TwoFactorFindUniqueArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find one TwoFactor that matches the filter or throw an error with `error.code='P2025'`
         * if no matches were found.
         * @param {TwoFactorFindUniqueOrThrowArgs} args - Arguments to find a TwoFactor
         * @example
         * // Get one TwoFactor
         * const twoFactor = await prisma.twoFactor.findUniqueOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUniqueOrThrow<T extends TwoFactorFindUniqueOrThrowArgs>(args: SelectSubset<T, TwoFactorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first TwoFactor that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {TwoFactorFindFirstArgs} args - Arguments to find a TwoFactor
         * @example
         * // Get one TwoFactor
         * const twoFactor = await prisma.twoFactor.findFirst({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirst<T extends TwoFactorFindFirstArgs>(args?: SelectSubset<T, TwoFactorFindFirstArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first TwoFactor that matches the filter or
         * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {TwoFactorFindFirstOrThrowArgs} args - Arguments to find a TwoFactor
         * @example
         * // Get one TwoFactor
         * const twoFactor = await prisma.twoFactor.findFirstOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirstOrThrow<T extends TwoFactorFindFirstOrThrowArgs>(args?: SelectSubset<T, TwoFactorFindFirstOrThrowArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find zero or more TwoFactors that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {TwoFactorFindManyArgs} args - Arguments to filter and select certain fields only.
         * @example
         * // Get all TwoFactors
         * const twoFactors = await prisma.twoFactor.findMany()
         *
         * // Get first 10 TwoFactors
         * const twoFactors = await prisma.twoFactor.findMany({ take: 10 })
         *
         * // Only select the `id`
         * const twoFactorWithIdOnly = await prisma.twoFactor.findMany({ select: { id: true } })
         *
         */
        findMany<T extends TwoFactorFindManyArgs>(args?: SelectSubset<T, TwoFactorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

        /**
         * Create a TwoFactor.
         * @param {TwoFactorCreateArgs} args - Arguments to create a TwoFactor.
         * @example
         * // Create one TwoFactor
         * const TwoFactor = await prisma.twoFactor.create({
         *   data: {
         *     // ... data to create a TwoFactor
         *   }
         * })
         *
         */
        create<T extends TwoFactorCreateArgs>(args: SelectSubset<T, TwoFactorCreateArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Create many TwoFactors.
         * @param {TwoFactorCreateManyArgs} args - Arguments to create many TwoFactors.
         * @example
         * // Create many TwoFactors
         * const twoFactor = await prisma.twoFactor.createMany({
         *   data: [
         *     // ... provide data here
         *   ]
         * })
         *
         */
        createMany<T extends TwoFactorCreateManyArgs>(args?: SelectSubset<T, TwoFactorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Delete a TwoFactor.
         * @param {TwoFactorDeleteArgs} args - Arguments to delete one TwoFactor.
         * @example
         * // Delete one TwoFactor
         * const TwoFactor = await prisma.twoFactor.delete({
         *   where: {
         *     // ... filter to delete one TwoFactor
         *   }
         * })
         *
         */
        delete<T extends TwoFactorDeleteArgs>(args: SelectSubset<T, TwoFactorDeleteArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Update one TwoFactor.
         * @param {TwoFactorUpdateArgs} args - Arguments to update one TwoFactor.
         * @example
         * // Update one TwoFactor
         * const twoFactor = await prisma.twoFactor.update({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        update<T extends TwoFactorUpdateArgs>(args: SelectSubset<T, TwoFactorUpdateArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Delete zero or more TwoFactors.
         * @param {TwoFactorDeleteManyArgs} args - Arguments to filter TwoFactors to delete.
         * @example
         * // Delete a few TwoFactors
         * const { count } = await prisma.twoFactor.deleteMany({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         *
         */
        deleteMany<T extends TwoFactorDeleteManyArgs>(args?: SelectSubset<T, TwoFactorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Update zero or more TwoFactors.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {TwoFactorUpdateManyArgs} args - Arguments to update one or more rows.
         * @example
         * // Update many TwoFactors
         * const twoFactor = await prisma.twoFactor.updateMany({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        updateMany<T extends TwoFactorUpdateManyArgs>(args: SelectSubset<T, TwoFactorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Create or update one TwoFactor.
         * @param {TwoFactorUpsertArgs} args - Arguments to update or create a TwoFactor.
         * @example
         * // Update or create a TwoFactor
         * const twoFactor = await prisma.twoFactor.upsert({
         *   create: {
         *     // ... data to create a TwoFactor
         *   },
         *   update: {
         *     // ... in case it already exists, update
         *   },
         *   where: {
         *     // ... the filter for the TwoFactor we want to update
         *   }
         * })
         */
        upsert<T extends TwoFactorUpsertArgs>(args: SelectSubset<T, TwoFactorUpsertArgs<ExtArgs>>): Prisma__TwoFactorClient<$Result.GetResult<Prisma.$TwoFactorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


        /**
         * Count the number of TwoFactors.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {TwoFactorCountArgs} args - Arguments to filter TwoFactors to count.
         * @example
         * // Count the number of TwoFactors
         * const count = await prisma.twoFactor.count({
         *   where: {
         *     // ... the filter for the TwoFactors we want to count
         *   }
         * })
         **/
        count<T extends TwoFactorCountArgs>(
            args?: Subset<T, TwoFactorCountArgs>,
        ): Prisma.PrismaPromise<
            T extends $Utils.Record<'select', any>
                ? T['select'] extends true
                    ? number
                    : GetScalarType<T['select'], TwoFactorCountAggregateOutputType>
                : number
        >

        /**
         * Allows you to perform aggregations operations on a TwoFactor.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {TwoFactorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
         * @example
         * // Ordered by age ascending
         * // Where email contains prisma.io
         * // Limited to the 10 users
         * const aggregations = await prisma.user.aggregate({
         *   _avg: {
         *     age: true,
         *   },
         *   where: {
         *     email: {
         *       contains: "prisma.io",
         *     },
         *   },
         *   orderBy: {
         *     age: "asc",
         *   },
         *   take: 10,
         * })
         **/
        aggregate<T extends TwoFactorAggregateArgs>(args: Subset<T, TwoFactorAggregateArgs>): Prisma.PrismaPromise<GetTwoFactorAggregateType<T>>

        /**
         * Group by TwoFactor.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {TwoFactorGroupByArgs} args - Group by arguments.
         * @example
         * // Group by city, order by createdAt, get count
         * const result = await prisma.user.groupBy({
         *   by: ['city', 'createdAt'],
         *   orderBy: {
         *     createdAt: true
         *   },
         *   _count: {
         *     _all: true
         *   },
         * })
         *
         **/
        groupBy<
            T extends TwoFactorGroupByArgs,
            HasSelectOrTake extends Or<
                Extends<'skip', Keys<T>>,
                Extends<'take', Keys<T>>
            >,
            OrderByArg extends True extends HasSelectOrTake
                ? { orderBy: TwoFactorGroupByArgs['orderBy'] }
                : { orderBy?: TwoFactorGroupByArgs['orderBy'] },
            OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
            ByFields extends MaybeTupleToUnion<T['by']>,
            ByValid extends Has<ByFields, OrderFields>,
            HavingFields extends GetHavingFields<T['having']>,
            HavingValid extends Has<ByFields, HavingFields>,
            ByEmpty extends T['by'] extends never[] ? True : False,
            InputErrors extends ByEmpty extends True
                ? `Error: "by" must not be empty.`
                : HavingValid extends False
                    ? {
                        [P in HavingFields]: P extends ByFields
                            ? never
                            : P extends string
                                ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                                : [
                                    Error,
                                    'Field ',
                                    P,
                                    ` in "having" needs to be provided in "by"`,
                                ]
                    }[HavingFields]
                    : 'take' extends Keys<T>
                        ? 'orderBy' extends Keys<T>
                            ? ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
                            : 'Error: If you provide "take", you also need to provide "orderBy"'
                        : 'skip' extends Keys<T>
                            ? 'orderBy' extends Keys<T>
                                ? ByValid extends True
                                    ? {}
                                    : {
                                        [P in OrderFields]: P extends ByFields
                                            ? never
                                            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                    }[OrderFields]
                                : 'Error: If you provide "skip", you also need to provide "orderBy"'
                            : ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
        >(args: SubsetIntersection<T, TwoFactorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTwoFactorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

        /**
         * Fields of the TwoFactor model
         */
        readonly fields: TwoFactorFieldRefs;
    }

    /**
     * The delegate class that acts as a "Promise-like" for TwoFactor.
     * Why is this prefixed with `Prisma__`?
     * Because we want to prevent naming conflicts as mentioned in
     * https://github.com/prisma/prisma-client-js/issues/707
     */
    export interface Prisma__TwoFactorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
        readonly [Symbol.toStringTag]: "PrismaPromise"

        user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         * @param onfulfilled The callback to execute when the Promise is resolved.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
         */
        then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>

        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>

        /**
         * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
         * resolved value cannot be modified from the callback.
         * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
         * @returns A Promise for the completion of the callback.
         */
        finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
    }


    /**
     * Fields of the TwoFactor model
     */
    interface TwoFactorFieldRefs {
        readonly id: FieldRef<"TwoFactor", 'String'>
        readonly secret: FieldRef<"TwoFactor", 'String'>
        readonly backupCodes: FieldRef<"TwoFactor", 'String'>
        readonly userId: FieldRef<"TwoFactor", 'String'>
    }


    // Custom InputTypes
    /**
     * TwoFactor findUnique
     */
    export type TwoFactorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * Filter, which TwoFactor to fetch.
         */
        where: TwoFactorWhereUniqueInput
    }

    /**
     * TwoFactor findUniqueOrThrow
     */
    export type TwoFactorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * Filter, which TwoFactor to fetch.
         */
        where: TwoFactorWhereUniqueInput
    }

    /**
     * TwoFactor findFirst
     */
    export type TwoFactorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * Filter, which TwoFactor to fetch.
         */
        where?: TwoFactorWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of TwoFactors to fetch.
         */
        orderBy?: TwoFactorOrderByWithRelationInput | TwoFactorOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for TwoFactors.
         */
        cursor?: TwoFactorWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` TwoFactors from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` TwoFactors.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of TwoFactors.
         */
        distinct?: TwoFactorScalarFieldEnum | TwoFactorScalarFieldEnum[]
    }

    /**
     * TwoFactor findFirstOrThrow
     */
    export type TwoFactorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * Filter, which TwoFactor to fetch.
         */
        where?: TwoFactorWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of TwoFactors to fetch.
         */
        orderBy?: TwoFactorOrderByWithRelationInput | TwoFactorOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for TwoFactors.
         */
        cursor?: TwoFactorWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` TwoFactors from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` TwoFactors.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of TwoFactors.
         */
        distinct?: TwoFactorScalarFieldEnum | TwoFactorScalarFieldEnum[]
    }

    /**
     * TwoFactor findMany
     */
    export type TwoFactorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * Filter, which TwoFactors to fetch.
         */
        where?: TwoFactorWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of TwoFactors to fetch.
         */
        orderBy?: TwoFactorOrderByWithRelationInput | TwoFactorOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for listing TwoFactors.
         */
        cursor?: TwoFactorWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` TwoFactors from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` TwoFactors.
         */
        skip?: number
        distinct?: TwoFactorScalarFieldEnum | TwoFactorScalarFieldEnum[]
    }

    /**
     * TwoFactor create
     */
    export type TwoFactorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * The data needed to create a TwoFactor.
         */
        data: XOR<TwoFactorCreateInput, TwoFactorUncheckedCreateInput>
    }

    /**
     * TwoFactor createMany
     */
    export type TwoFactorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to create many TwoFactors.
         */
        data: TwoFactorCreateManyInput | TwoFactorCreateManyInput[]
        skipDuplicates?: boolean
    }

    /**
     * TwoFactor update
     */
    export type TwoFactorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * The data needed to update a TwoFactor.
         */
        data: XOR<TwoFactorUpdateInput, TwoFactorUncheckedUpdateInput>
        /**
         * Choose, which TwoFactor to update.
         */
        where: TwoFactorWhereUniqueInput
    }

    /**
     * TwoFactor updateMany
     */
    export type TwoFactorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to update TwoFactors.
         */
        data: XOR<TwoFactorUpdateManyMutationInput, TwoFactorUncheckedUpdateManyInput>
        /**
         * Filter which TwoFactors to update
         */
        where?: TwoFactorWhereInput
        /**
         * Limit how many TwoFactors to update.
         */
        limit?: number
    }

    /**
     * TwoFactor upsert
     */
    export type TwoFactorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * The filter to search for the TwoFactor to update in case it exists.
         */
        where: TwoFactorWhereUniqueInput
        /**
         * In case the TwoFactor found by the `where` argument doesn't exist, create a new TwoFactor with this data.
         */
        create: XOR<TwoFactorCreateInput, TwoFactorUncheckedCreateInput>
        /**
         * In case the TwoFactor was found with the provided `where` argument, update it with this data.
         */
        update: XOR<TwoFactorUpdateInput, TwoFactorUncheckedUpdateInput>
    }

    /**
     * TwoFactor delete
     */
    export type TwoFactorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
        /**
         * Filter which TwoFactor to delete.
         */
        where: TwoFactorWhereUniqueInput
    }

    /**
     * TwoFactor deleteMany
     */
    export type TwoFactorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which TwoFactors to delete
         */
        where?: TwoFactorWhereInput
        /**
         * Limit how many TwoFactors to delete.
         */
        limit?: number
    }

    /**
     * TwoFactor without action
     */
    export type TwoFactorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the TwoFactor
         */
        select?: TwoFactorSelect<ExtArgs> | null
        /**
         * Omit specific fields from the TwoFactor
         */
        omit?: TwoFactorOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: TwoFactorInclude<ExtArgs> | null
    }


    /**
     * Model Message
     */

    export type AggregateMessage = {
        _count: MessageCountAggregateOutputType | null
        _avg: MessageAvgAggregateOutputType | null
        _sum: MessageSumAggregateOutputType | null
        _min: MessageMinAggregateOutputType | null
        _max: MessageMaxAggregateOutputType | null
    }

    export type MessageAvgAggregateOutputType = {
        id: number | null
    }

    export type MessageSumAggregateOutputType = {
        id: number | null
    }

    export type MessageMinAggregateOutputType = {
        id: number | null
        createdAt: Date | null
        userId: string | null
        channelId: string | null
        content: Uint8Array | null
    }

    export type MessageMaxAggregateOutputType = {
        id: number | null
        createdAt: Date | null
        userId: string | null
        channelId: string | null
        content: Uint8Array | null
    }

    export type MessageCountAggregateOutputType = {
        id: number
        createdAt: number
        userId: number
        channelId: number
        content: number
        _all: number
    }


    export type MessageAvgAggregateInputType = {
        id?: true
    }

    export type MessageSumAggregateInputType = {
        id?: true
    }

    export type MessageMinAggregateInputType = {
        id?: true
        createdAt?: true
        userId?: true
        channelId?: true
        content?: true
    }

    export type MessageMaxAggregateInputType = {
        id?: true
        createdAt?: true
        userId?: true
        channelId?: true
        content?: true
    }

    export type MessageCountAggregateInputType = {
        id?: true
        createdAt?: true
        userId?: true
        channelId?: true
        content?: true
        _all?: true
    }

    export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Message to aggregate.
         */
        where?: MessageWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Messages to fetch.
         */
        orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the start position
         */
        cursor?: MessageWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Messages from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Messages.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Count returned Messages
         **/
        _count?: true | MessageCountAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to average
         **/
        _avg?: MessageAvgAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to sum
         **/
        _sum?: MessageSumAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the minimum value
         **/
        _min?: MessageMinAggregateInputType
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
         *
         * Select which fields to find the maximum value
         **/
        _max?: MessageMaxAggregateInputType
    }

    export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
            ? T[P] extends true
                ? number
                : GetScalarType<T[P], AggregateMessage[P]>
            : GetScalarType<T[P], AggregateMessage[P]>
    }


    export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        where?: MessageWhereInput
        orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
        by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
        having?: MessageScalarWhereWithAggregatesInput
        take?: number
        skip?: number
        _count?: MessageCountAggregateInputType | true
        _avg?: MessageAvgAggregateInputType
        _sum?: MessageSumAggregateInputType
        _min?: MessageMinAggregateInputType
        _max?: MessageMaxAggregateInputType
    }

    export type MessageGroupByOutputType = {
        id: number
        createdAt: Date
        userId: string
        channelId: string
        content: Uint8Array
        _count: MessageCountAggregateOutputType | null
        _avg: MessageAvgAggregateOutputType | null
        _sum: MessageSumAggregateOutputType | null
        _min: MessageMinAggregateOutputType | null
        _max: MessageMaxAggregateOutputType | null
    }

    type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
        Array<
            PickEnumerable<MessageGroupByOutputType, T['by']> &
            {
                [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
                ? T[P] extends boolean
                    ? number
                    : GetScalarType<T[P], MessageGroupByOutputType[P]>
                : GetScalarType<T[P], MessageGroupByOutputType[P]>
            }
        >
    >


    export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
        id?: boolean
        createdAt?: boolean
        userId?: boolean
        channelId?: boolean
        content?: boolean
        user?: boolean | UserDefaultArgs<ExtArgs>
    }, ExtArgs["result"]["message"]>


    export type MessageSelectScalar = {
        id?: boolean
        createdAt?: boolean
        userId?: boolean
        channelId?: boolean
        content?: boolean
    }

    export type MessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "userId" | "channelId" | "content", ExtArgs["result"]["message"]>
    export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        user?: boolean | UserDefaultArgs<ExtArgs>
    }

    export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        name: "Message"
        objects: {
            user: Prisma.$UserPayload<ExtArgs>
        }
        scalars: $Extensions.GetPayloadResult<{
            id: number
            createdAt: Date
            userId: string
            channelId: string
            content: Uint8Array
        }, ExtArgs["result"]["message"]>
        composites: {}
    }

    type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

    type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
        Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
        select?: MessageCountAggregateInputType | true
    }

    export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
        [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }

        /**
         * Find zero or one Message that matches the filter.
         * @param {MessageFindUniqueArgs} args - Arguments to find a Message
         * @example
         * // Get one Message
         * const message = await prisma.message.findUnique({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find one Message that matches the filter or throw an error with `error.code='P2025'`
         * if no matches were found.
         * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
         * @example
         * // Get one Message
         * const message = await prisma.message.findUniqueOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Message that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MessageFindFirstArgs} args - Arguments to find a Message
         * @example
         * // Get one Message
         * const message = await prisma.message.findFirst({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

        /**
         * Find the first Message that matches the filter or
         * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
         * @example
         * // Get one Message
         * const message = await prisma.message.findFirstOrThrow({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         */
        findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Find zero or more Messages that matches the filter.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
         * @example
         * // Get all Messages
         * const messages = await prisma.message.findMany()
         *
         * // Get first 10 Messages
         * const messages = await prisma.message.findMany({ take: 10 })
         *
         * // Only select the `id`
         * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
         *
         */
        findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

        /**
         * Create a Message.
         * @param {MessageCreateArgs} args - Arguments to create a Message.
         * @example
         * // Create one Message
         * const Message = await prisma.message.create({
         *   data: {
         *     // ... data to create a Message
         *   }
         * })
         *
         */
        create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Create many Messages.
         * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
         * @example
         * // Create many Messages
         * const message = await prisma.message.createMany({
         *   data: [
         *     // ... provide data here
         *   ]
         * })
         *
         */
        createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Delete a Message.
         * @param {MessageDeleteArgs} args - Arguments to delete one Message.
         * @example
         * // Delete one Message
         * const Message = await prisma.message.delete({
         *   where: {
         *     // ... filter to delete one Message
         *   }
         * })
         *
         */
        delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Update one Message.
         * @param {MessageUpdateArgs} args - Arguments to update one Message.
         * @example
         * // Update one Message
         * const message = await prisma.message.update({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

        /**
         * Delete zero or more Messages.
         * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
         * @example
         * // Delete a few Messages
         * const { count } = await prisma.message.deleteMany({
         *   where: {
         *     // ... provide filter here
         *   }
         * })
         *
         */
        deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Update zero or more Messages.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
         * @example
         * // Update many Messages
         * const message = await prisma.message.updateMany({
         *   where: {
         *     // ... provide filter here
         *   },
         *   data: {
         *     // ... provide data here
         *   }
         * })
         *
         */
        updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

        /**
         * Create or update one Message.
         * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
         * @example
         * // Update or create a Message
         * const message = await prisma.message.upsert({
         *   create: {
         *     // ... data to create a Message
         *   },
         *   update: {
         *     // ... in case it already exists, update
         *   },
         *   where: {
         *     // ... the filter for the Message we want to update
         *   }
         * })
         */
        upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


        /**
         * Count the number of Messages.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MessageCountArgs} args - Arguments to filter Messages to count.
         * @example
         * // Count the number of Messages
         * const count = await prisma.message.count({
         *   where: {
         *     // ... the filter for the Messages we want to count
         *   }
         * })
         **/
        count<T extends MessageCountArgs>(
            args?: Subset<T, MessageCountArgs>,
        ): Prisma.PrismaPromise<
            T extends $Utils.Record<'select', any>
                ? T['select'] extends true
                    ? number
                    : GetScalarType<T['select'], MessageCountAggregateOutputType>
                : number
        >

        /**
         * Allows you to perform aggregations operations on a Message.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
         * @example
         * // Ordered by age ascending
         * // Where email contains prisma.io
         * // Limited to the 10 users
         * const aggregations = await prisma.user.aggregate({
         *   _avg: {
         *     age: true,
         *   },
         *   where: {
         *     email: {
         *       contains: "prisma.io",
         *     },
         *   },
         *   orderBy: {
         *     age: "asc",
         *   },
         *   take: 10,
         * })
         **/
        aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

        /**
         * Group by Message.
         * Note, that providing `undefined` is treated as the value not being there.
         * Read more here: https://pris.ly/d/null-undefined
         * @param {MessageGroupByArgs} args - Group by arguments.
         * @example
         * // Group by city, order by createdAt, get count
         * const result = await prisma.user.groupBy({
         *   by: ['city', 'createdAt'],
         *   orderBy: {
         *     createdAt: true
         *   },
         *   _count: {
         *     _all: true
         *   },
         * })
         *
         **/
        groupBy<
            T extends MessageGroupByArgs,
            HasSelectOrTake extends Or<
                Extends<'skip', Keys<T>>,
                Extends<'take', Keys<T>>
            >,
            OrderByArg extends True extends HasSelectOrTake
                ? { orderBy: MessageGroupByArgs['orderBy'] }
                : { orderBy?: MessageGroupByArgs['orderBy'] },
            OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
            ByFields extends MaybeTupleToUnion<T['by']>,
            ByValid extends Has<ByFields, OrderFields>,
            HavingFields extends GetHavingFields<T['having']>,
            HavingValid extends Has<ByFields, HavingFields>,
            ByEmpty extends T['by'] extends never[] ? True : False,
            InputErrors extends ByEmpty extends True
                ? `Error: "by" must not be empty.`
                : HavingValid extends False
                    ? {
                        [P in HavingFields]: P extends ByFields
                            ? never
                            : P extends string
                                ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                                : [
                                    Error,
                                    'Field ',
                                    P,
                                    ` in "having" needs to be provided in "by"`,
                                ]
                    }[HavingFields]
                    : 'take' extends Keys<T>
                        ? 'orderBy' extends Keys<T>
                            ? ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
                            : 'Error: If you provide "take", you also need to provide "orderBy"'
                        : 'skip' extends Keys<T>
                            ? 'orderBy' extends Keys<T>
                                ? ByValid extends True
                                    ? {}
                                    : {
                                        [P in OrderFields]: P extends ByFields
                                            ? never
                                            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                    }[OrderFields]
                                : 'Error: If you provide "skip", you also need to provide "orderBy"'
                            : ByValid extends True
                                ? {}
                                : {
                                    [P in OrderFields]: P extends ByFields
                                        ? never
                                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                                }[OrderFields]
        >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

        /**
         * Fields of the Message model
         */
        readonly fields: MessageFieldRefs;
    }

    /**
     * The delegate class that acts as a "Promise-like" for Message.
     * Why is this prefixed with `Prisma__`?
     * Because we want to prevent naming conflicts as mentioned in
     * https://github.com/prisma/prisma-client-js/issues/707
     */
    export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
        readonly [Symbol.toStringTag]: "PrismaPromise"

        user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         * @param onfulfilled The callback to execute when the Promise is resolved.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
         */
        then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>

        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>

        /**
         * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
         * resolved value cannot be modified from the callback.
         * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
         * @returns A Promise for the completion of the callback.
         */
        finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
    }


    /**
     * Fields of the Message model
     */
    interface MessageFieldRefs {
        readonly id: FieldRef<"Message", 'Int'>
        readonly createdAt: FieldRef<"Message", 'DateTime'>
        readonly userId: FieldRef<"Message", 'String'>
        readonly channelId: FieldRef<"Message", 'String'>
        readonly content: FieldRef<"Message", 'Bytes'>
    }


    // Custom InputTypes
    /**
     * Message findUnique
     */
    export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * Filter, which Message to fetch.
         */
        where: MessageWhereUniqueInput
    }

    /**
     * Message findUniqueOrThrow
     */
    export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * Filter, which Message to fetch.
         */
        where: MessageWhereUniqueInput
    }

    /**
     * Message findFirst
     */
    export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * Filter, which Message to fetch.
         */
        where?: MessageWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Messages to fetch.
         */
        orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Messages.
         */
        cursor?: MessageWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Messages from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Messages.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Messages.
         */
        distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
    }

    /**
     * Message findFirstOrThrow
     */
    export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * Filter, which Message to fetch.
         */
        where?: MessageWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Messages to fetch.
         */
        orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for searching for Messages.
         */
        cursor?: MessageWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Messages from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Messages.
         */
        skip?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
         *
         * Filter by unique combinations of Messages.
         */
        distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
    }

    /**
     * Message findMany
     */
    export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * Filter, which Messages to fetch.
         */
        where?: MessageWhereInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
         *
         * Determine the order of Messages to fetch.
         */
        orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
         *
         * Sets the position for listing Messages.
         */
        cursor?: MessageWhereUniqueInput
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Take `±n` Messages from the position of the cursor.
         */
        take?: number
        /**
         * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
         *
         * Skip the first `n` Messages.
         */
        skip?: number
        distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
    }

    /**
     * Message create
     */
    export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * The data needed to create a Message.
         */
        data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    }

    /**
     * Message createMany
     */
    export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to create many Messages.
         */
        data: MessageCreateManyInput | MessageCreateManyInput[]
        skipDuplicates?: boolean
    }

    /**
     * Message update
     */
    export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * The data needed to update a Message.
         */
        data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
        /**
         * Choose, which Message to update.
         */
        where: MessageWhereUniqueInput
    }

    /**
     * Message updateMany
     */
    export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * The data used to update Messages.
         */
        data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
        /**
         * Filter which Messages to update
         */
        where?: MessageWhereInput
        /**
         * Limit how many Messages to update.
         */
        limit?: number
    }

    /**
     * Message upsert
     */
    export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * The filter to search for the Message to update in case it exists.
         */
        where: MessageWhereUniqueInput
        /**
         * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
         */
        create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
        /**
         * In case the Message was found with the provided `where` argument, update it with this data.
         */
        update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    }

    /**
     * Message delete
     */
    export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
        /**
         * Filter which Message to delete.
         */
        where: MessageWhereUniqueInput
    }

    /**
     * Message deleteMany
     */
    export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Filter which Messages to delete
         */
        where?: MessageWhereInput
        /**
         * Limit how many Messages to delete.
         */
        limit?: number
    }

    /**
     * Message without action
     */
    export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
        /**
         * Select specific fields to fetch from the Message
         */
        select?: MessageSelect<ExtArgs> | null
        /**
         * Omit specific fields from the Message
         */
        omit?: MessageOmit<ExtArgs> | null
        /**
         * Choose, which related nodes to fetch as well
         */
        include?: MessageInclude<ExtArgs> | null
    }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    emailVerified: 'emailVerified',
    image: 'image',
    createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      role: 'role',
      banned: 'banned',
      banReason: 'banReason',
      banExpires: 'banExpires',
      twoFactorEnabled: 'twoFactorEnabled'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const SessionScalarFieldEnum: {
    id: 'id',
    expiresAt: 'expiresAt',
    token: 'token',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    ipAddress: 'ipAddress',
    userAgent: 'userAgent',
      userId: 'userId',
      impersonatedBy: 'impersonatedBy',
      activeOrganizationId: 'activeOrganizationId'
  };

  export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum]


  export const AccountScalarFieldEnum: {
    id: 'id',
    accountId: 'accountId',
    providerId: 'providerId',
    userId: 'userId',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    idToken: 'idToken',
    accessTokenExpiresAt: 'accessTokenExpiresAt',
    refreshTokenExpiresAt: 'refreshTokenExpiresAt',
    scope: 'scope',
    password: 'password',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AccountScalarFieldEnum = (typeof AccountScalarFieldEnum)[keyof typeof AccountScalarFieldEnum]


  export const VerificationScalarFieldEnum: {
    id: 'id',
    identifier: 'identifier',
    value: 'value',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VerificationScalarFieldEnum = (typeof VerificationScalarFieldEnum)[keyof typeof VerificationScalarFieldEnum]


    export const OrganizationScalarFieldEnum: {
        id: 'id',
        name: 'name',
        slug: 'slug',
        logo: 'logo',
        createdAt: 'createdAt',
        metadata: 'metadata'
    };

    export type OrganizationScalarFieldEnum = (typeof OrganizationScalarFieldEnum)[keyof typeof OrganizationScalarFieldEnum]


    export const MemberScalarFieldEnum: {
        id: 'id',
        organizationId: 'organizationId',
        userId: 'userId',
        role: 'role',
        createdAt: 'createdAt'
    };

    export type MemberScalarFieldEnum = (typeof MemberScalarFieldEnum)[keyof typeof MemberScalarFieldEnum]


    export const InvitationScalarFieldEnum: {
        id: 'id',
        organizationId: 'organizationId',
        email: 'email',
        role: 'role',
        status: 'status',
        expiresAt: 'expiresAt',
        inviterId: 'inviterId'
    };

    export type InvitationScalarFieldEnum = (typeof InvitationScalarFieldEnum)[keyof typeof InvitationScalarFieldEnum]


    export const TwoFactorScalarFieldEnum: {
        id: 'id',
        secret: 'secret',
        backupCodes: 'backupCodes',
        userId: 'userId'
    };

    export type TwoFactorScalarFieldEnum = (typeof TwoFactorScalarFieldEnum)[keyof typeof TwoFactorScalarFieldEnum]


    export const MessageScalarFieldEnum: {
        id: 'id',
        createdAt: 'createdAt',
        userId: 'userId',
        channelId: 'channelId',
        content: 'content'
    };

    export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const UserOrderByRelevanceFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
      image: 'image',
      role: 'role',
      banReason: 'banReason'
  };

  export type UserOrderByRelevanceFieldEnum = (typeof UserOrderByRelevanceFieldEnum)[keyof typeof UserOrderByRelevanceFieldEnum]


  export const SessionOrderByRelevanceFieldEnum: {
    id: 'id',
    token: 'token',
    ipAddress: 'ipAddress',
    userAgent: 'userAgent',
      userId: 'userId',
      impersonatedBy: 'impersonatedBy',
      activeOrganizationId: 'activeOrganizationId'
  };

  export type SessionOrderByRelevanceFieldEnum = (typeof SessionOrderByRelevanceFieldEnum)[keyof typeof SessionOrderByRelevanceFieldEnum]


  export const AccountOrderByRelevanceFieldEnum: {
    id: 'id',
    accountId: 'accountId',
    providerId: 'providerId',
    userId: 'userId',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    idToken: 'idToken',
    scope: 'scope',
    password: 'password'
  };

  export type AccountOrderByRelevanceFieldEnum = (typeof AccountOrderByRelevanceFieldEnum)[keyof typeof AccountOrderByRelevanceFieldEnum]


  export const VerificationOrderByRelevanceFieldEnum: {
    id: 'id',
    identifier: 'identifier',
    value: 'value'
  };

  export type VerificationOrderByRelevanceFieldEnum = (typeof VerificationOrderByRelevanceFieldEnum)[keyof typeof VerificationOrderByRelevanceFieldEnum]


    export const OrganizationOrderByRelevanceFieldEnum: {
        id: 'id',
        name: 'name',
        slug: 'slug',
        logo: 'logo',
        metadata: 'metadata'
    };

    export type OrganizationOrderByRelevanceFieldEnum = (typeof OrganizationOrderByRelevanceFieldEnum)[keyof typeof OrganizationOrderByRelevanceFieldEnum]


    export const MemberOrderByRelevanceFieldEnum: {
        id: 'id',
        organizationId: 'organizationId',
        userId: 'userId',
        role: 'role'
    };

    export type MemberOrderByRelevanceFieldEnum = (typeof MemberOrderByRelevanceFieldEnum)[keyof typeof MemberOrderByRelevanceFieldEnum]


    export const InvitationOrderByRelevanceFieldEnum: {
        id: 'id',
        organizationId: 'organizationId',
        email: 'email',
        role: 'role',
        status: 'status',
        inviterId: 'inviterId'
    };

    export type InvitationOrderByRelevanceFieldEnum = (typeof InvitationOrderByRelevanceFieldEnum)[keyof typeof InvitationOrderByRelevanceFieldEnum]


    export const TwoFactorOrderByRelevanceFieldEnum: {
        id: 'id',
        secret: 'secret',
        backupCodes: 'backupCodes',
        userId: 'userId'
    };

    export type TwoFactorOrderByRelevanceFieldEnum = (typeof TwoFactorOrderByRelevanceFieldEnum)[keyof typeof TwoFactorOrderByRelevanceFieldEnum]


    export const MessageOrderByRelevanceFieldEnum: {
        userId: 'userId',
        channelId: 'channelId'
    };

    export type MessageOrderByRelevanceFieldEnum = (typeof MessageOrderByRelevanceFieldEnum)[keyof typeof MessageOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>


    /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>


    /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>


    /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>


    /**
     * Reference to a field of type 'Bytes'
     */
    export type BytesFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Bytes'>


    /**
     * Reference to a field of type 'Float'
     */
    export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>

  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    emailVerified?: BoolFilter<"User"> | boolean
    image?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
      role?: StringNullableFilter<"User"> | string | null
      banned?: BoolNullableFilter<"User"> | boolean | null
      banReason?: StringNullableFilter<"User"> | string | null
      banExpires?: DateTimeNullableFilter<"User"> | Date | string | null
      twoFactorEnabled?: BoolNullableFilter<"User"> | boolean | null
    accounts?: AccountListRelationFilter
    sessions?: SessionListRelationFilter
      messages?: MessageListRelationFilter
      members?: MemberListRelationFilter
      invitations?: InvitationListRelationFilter
      twofactors?: TwoFactorListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
      role?: SortOrderInput | SortOrder
      banned?: SortOrderInput | SortOrder
      banReason?: SortOrderInput | SortOrder
      banExpires?: SortOrderInput | SortOrder
      twoFactorEnabled?: SortOrderInput | SortOrder
    accounts?: AccountOrderByRelationAggregateInput
    sessions?: SessionOrderByRelationAggregateInput
      messages?: MessageOrderByRelationAggregateInput
      members?: MemberOrderByRelationAggregateInput
      invitations?: InvitationOrderByRelationAggregateInput
      twofactors?: TwoFactorOrderByRelationAggregateInput
    _relevance?: UserOrderByRelevanceInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    emailVerified?: BoolFilter<"User"> | boolean
    image?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
      role?: StringNullableFilter<"User"> | string | null
      banned?: BoolNullableFilter<"User"> | boolean | null
      banReason?: StringNullableFilter<"User"> | string | null
      banExpires?: DateTimeNullableFilter<"User"> | Date | string | null
      twoFactorEnabled?: BoolNullableFilter<"User"> | boolean | null
    accounts?: AccountListRelationFilter
    sessions?: SessionListRelationFilter
      messages?: MessageListRelationFilter
      members?: MemberListRelationFilter
      invitations?: InvitationListRelationFilter
      twofactors?: TwoFactorListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
      role?: SortOrderInput | SortOrder
      banned?: SortOrderInput | SortOrder
      banReason?: SortOrderInput | SortOrder
      banExpires?: SortOrderInput | SortOrder
      twoFactorEnabled?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    emailVerified?: BoolWithAggregatesFilter<"User"> | boolean
    image?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
      role?: StringNullableWithAggregatesFilter<"User"> | string | null
      banned?: BoolNullableWithAggregatesFilter<"User"> | boolean | null
      banReason?: StringNullableWithAggregatesFilter<"User"> | string | null
      banExpires?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
      twoFactorEnabled?: BoolNullableWithAggregatesFilter<"User"> | boolean | null
  }

  export type SessionWhereInput = {
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    id?: StringFilter<"Session"> | string
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    token?: StringFilter<"Session"> | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    updatedAt?: DateTimeFilter<"Session"> | Date | string
    ipAddress?: StringNullableFilter<"Session"> | string | null
    userAgent?: StringNullableFilter<"Session"> | string | null
    userId?: StringFilter<"Session"> | string
      impersonatedBy?: StringNullableFilter<"Session"> | string | null
      activeOrganizationId?: StringNullableFilter<"Session"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SessionOrderByWithRelationInput = {
    id?: SortOrder
    expiresAt?: SortOrder
    token?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    userId?: SortOrder
      impersonatedBy?: SortOrderInput | SortOrder
      activeOrganizationId?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
    _relevance?: SessionOrderByRelevanceInput
  }

  export type SessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    updatedAt?: DateTimeFilter<"Session"> | Date | string
    ipAddress?: StringNullableFilter<"Session"> | string | null
    userAgent?: StringNullableFilter<"Session"> | string | null
    userId?: StringFilter<"Session"> | string
      impersonatedBy?: StringNullableFilter<"Session"> | string | null
      activeOrganizationId?: StringNullableFilter<"Session"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type SessionOrderByWithAggregationInput = {
    id?: SortOrder
    expiresAt?: SortOrder
    token?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    userId?: SortOrder
      impersonatedBy?: SortOrderInput | SortOrder
      activeOrganizationId?: SortOrderInput | SortOrder
    _count?: SessionCountOrderByAggregateInput
    _max?: SessionMaxOrderByAggregateInput
    _min?: SessionMinOrderByAggregateInput
  }

  export type SessionScalarWhereWithAggregatesInput = {
    AND?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    OR?: SessionScalarWhereWithAggregatesInput[]
    NOT?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Session"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
    token?: StringWithAggregatesFilter<"Session"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
    ipAddress?: StringNullableWithAggregatesFilter<"Session"> | string | null
    userAgent?: StringNullableWithAggregatesFilter<"Session"> | string | null
    userId?: StringWithAggregatesFilter<"Session"> | string
      impersonatedBy?: StringNullableWithAggregatesFilter<"Session"> | string | null
      activeOrganizationId?: StringNullableWithAggregatesFilter<"Session"> | string | null
  }

  export type AccountWhereInput = {
    AND?: AccountWhereInput | AccountWhereInput[]
    OR?: AccountWhereInput[]
    NOT?: AccountWhereInput | AccountWhereInput[]
    id?: StringFilter<"Account"> | string
    accountId?: StringFilter<"Account"> | string
    providerId?: StringFilter<"Account"> | string
    userId?: StringFilter<"Account"> | string
    accessToken?: StringNullableFilter<"Account"> | string | null
    refreshToken?: StringNullableFilter<"Account"> | string | null
    idToken?: StringNullableFilter<"Account"> | string | null
    accessTokenExpiresAt?: DateTimeNullableFilter<"Account"> | Date | string | null
    refreshTokenExpiresAt?: DateTimeNullableFilter<"Account"> | Date | string | null
    scope?: StringNullableFilter<"Account"> | string | null
    password?: StringNullableFilter<"Account"> | string | null
    createdAt?: DateTimeFilter<"Account"> | Date | string
    updatedAt?: DateTimeFilter<"Account"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type AccountOrderByWithRelationInput = {
    id?: SortOrder
    accountId?: SortOrder
    providerId?: SortOrder
    userId?: SortOrder
    accessToken?: SortOrderInput | SortOrder
    refreshToken?: SortOrderInput | SortOrder
    idToken?: SortOrderInput | SortOrder
    accessTokenExpiresAt?: SortOrderInput | SortOrder
    refreshTokenExpiresAt?: SortOrderInput | SortOrder
    scope?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    _relevance?: AccountOrderByRelevanceInput
  }

  export type AccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AccountWhereInput | AccountWhereInput[]
    OR?: AccountWhereInput[]
    NOT?: AccountWhereInput | AccountWhereInput[]
    accountId?: StringFilter<"Account"> | string
    providerId?: StringFilter<"Account"> | string
    userId?: StringFilter<"Account"> | string
    accessToken?: StringNullableFilter<"Account"> | string | null
    refreshToken?: StringNullableFilter<"Account"> | string | null
    idToken?: StringNullableFilter<"Account"> | string | null
    accessTokenExpiresAt?: DateTimeNullableFilter<"Account"> | Date | string | null
    refreshTokenExpiresAt?: DateTimeNullableFilter<"Account"> | Date | string | null
    scope?: StringNullableFilter<"Account"> | string | null
    password?: StringNullableFilter<"Account"> | string | null
    createdAt?: DateTimeFilter<"Account"> | Date | string
    updatedAt?: DateTimeFilter<"Account"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type AccountOrderByWithAggregationInput = {
    id?: SortOrder
    accountId?: SortOrder
    providerId?: SortOrder
    userId?: SortOrder
    accessToken?: SortOrderInput | SortOrder
    refreshToken?: SortOrderInput | SortOrder
    idToken?: SortOrderInput | SortOrder
    accessTokenExpiresAt?: SortOrderInput | SortOrder
    refreshTokenExpiresAt?: SortOrderInput | SortOrder
    scope?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AccountCountOrderByAggregateInput
    _max?: AccountMaxOrderByAggregateInput
    _min?: AccountMinOrderByAggregateInput
  }

  export type AccountScalarWhereWithAggregatesInput = {
    AND?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[]
    OR?: AccountScalarWhereWithAggregatesInput[]
    NOT?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Account"> | string
    accountId?: StringWithAggregatesFilter<"Account"> | string
    providerId?: StringWithAggregatesFilter<"Account"> | string
    userId?: StringWithAggregatesFilter<"Account"> | string
    accessToken?: StringNullableWithAggregatesFilter<"Account"> | string | null
    refreshToken?: StringNullableWithAggregatesFilter<"Account"> | string | null
    idToken?: StringNullableWithAggregatesFilter<"Account"> | string | null
    accessTokenExpiresAt?: DateTimeNullableWithAggregatesFilter<"Account"> | Date | string | null
    refreshTokenExpiresAt?: DateTimeNullableWithAggregatesFilter<"Account"> | Date | string | null
    scope?: StringNullableWithAggregatesFilter<"Account"> | string | null
    password?: StringNullableWithAggregatesFilter<"Account"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Account"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Account"> | Date | string
  }

  export type VerificationWhereInput = {
    AND?: VerificationWhereInput | VerificationWhereInput[]
    OR?: VerificationWhereInput[]
    NOT?: VerificationWhereInput | VerificationWhereInput[]
    id?: StringFilter<"Verification"> | string
    identifier?: StringFilter<"Verification"> | string
    value?: StringFilter<"Verification"> | string
    expiresAt?: DateTimeFilter<"Verification"> | Date | string
    createdAt?: DateTimeNullableFilter<"Verification"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"Verification"> | Date | string | null
  }

  export type VerificationOrderByWithRelationInput = {
    id?: SortOrder
    identifier?: SortOrder
    value?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    _relevance?: VerificationOrderByRelevanceInput
  }

  export type VerificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationWhereInput | VerificationWhereInput[]
    OR?: VerificationWhereInput[]
    NOT?: VerificationWhereInput | VerificationWhereInput[]
    identifier?: StringFilter<"Verification"> | string
    value?: StringFilter<"Verification"> | string
    expiresAt?: DateTimeFilter<"Verification"> | Date | string
    createdAt?: DateTimeNullableFilter<"Verification"> | Date | string | null
    updatedAt?: DateTimeNullableFilter<"Verification"> | Date | string | null
  }, "id">

  export type VerificationOrderByWithAggregationInput = {
    id?: SortOrder
    identifier?: SortOrder
    value?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrderInput | SortOrder
    updatedAt?: SortOrderInput | SortOrder
    _count?: VerificationCountOrderByAggregateInput
    _max?: VerificationMaxOrderByAggregateInput
    _min?: VerificationMinOrderByAggregateInput
  }

  export type VerificationScalarWhereWithAggregatesInput = {
    AND?: VerificationScalarWhereWithAggregatesInput | VerificationScalarWhereWithAggregatesInput[]
    OR?: VerificationScalarWhereWithAggregatesInput[]
    NOT?: VerificationScalarWhereWithAggregatesInput | VerificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Verification"> | string
    identifier?: StringWithAggregatesFilter<"Verification"> | string
    value?: StringWithAggregatesFilter<"Verification"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"Verification"> | Date | string
    createdAt?: DateTimeNullableWithAggregatesFilter<"Verification"> | Date | string | null
    updatedAt?: DateTimeNullableWithAggregatesFilter<"Verification"> | Date | string | null
  }

    export type OrganizationWhereInput = {
        AND?: OrganizationWhereInput | OrganizationWhereInput[]
        OR?: OrganizationWhereInput[]
        NOT?: OrganizationWhereInput | OrganizationWhereInput[]
        id?: StringFilter<"Organization"> | string
        name?: StringFilter<"Organization"> | string
        slug?: StringNullableFilter<"Organization"> | string | null
        logo?: StringNullableFilter<"Organization"> | string | null
        createdAt?: DateTimeFilter<"Organization"> | Date | string
        metadata?: StringNullableFilter<"Organization"> | string | null
        members?: MemberListRelationFilter
        invitations?: InvitationListRelationFilter
    }

    export type OrganizationOrderByWithRelationInput = {
        id?: SortOrder
        name?: SortOrder
        slug?: SortOrderInput | SortOrder
        logo?: SortOrderInput | SortOrder
        createdAt?: SortOrder
        metadata?: SortOrderInput | SortOrder
        members?: MemberOrderByRelationAggregateInput
        invitations?: InvitationOrderByRelationAggregateInput
        _relevance?: OrganizationOrderByRelevanceInput
    }

    export type OrganizationWhereUniqueInput = Prisma.AtLeast<{
        id?: string
        slug?: string
        AND?: OrganizationWhereInput | OrganizationWhereInput[]
        OR?: OrganizationWhereInput[]
        NOT?: OrganizationWhereInput | OrganizationWhereInput[]
        name?: StringFilter<"Organization"> | string
        logo?: StringNullableFilter<"Organization"> | string | null
        createdAt?: DateTimeFilter<"Organization"> | Date | string
        metadata?: StringNullableFilter<"Organization"> | string | null
        members?: MemberListRelationFilter
        invitations?: InvitationListRelationFilter
    }, "id" | "slug">

    export type OrganizationOrderByWithAggregationInput = {
        id?: SortOrder
        name?: SortOrder
        slug?: SortOrderInput | SortOrder
        logo?: SortOrderInput | SortOrder
        createdAt?: SortOrder
        metadata?: SortOrderInput | SortOrder
        _count?: OrganizationCountOrderByAggregateInput
        _max?: OrganizationMaxOrderByAggregateInput
        _min?: OrganizationMinOrderByAggregateInput
    }

    export type OrganizationScalarWhereWithAggregatesInput = {
        AND?: OrganizationScalarWhereWithAggregatesInput | OrganizationScalarWhereWithAggregatesInput[]
        OR?: OrganizationScalarWhereWithAggregatesInput[]
        NOT?: OrganizationScalarWhereWithAggregatesInput | OrganizationScalarWhereWithAggregatesInput[]
        id?: StringWithAggregatesFilter<"Organization"> | string
        name?: StringWithAggregatesFilter<"Organization"> | string
        slug?: StringNullableWithAggregatesFilter<"Organization"> | string | null
        logo?: StringNullableWithAggregatesFilter<"Organization"> | string | null
        createdAt?: DateTimeWithAggregatesFilter<"Organization"> | Date | string
        metadata?: StringNullableWithAggregatesFilter<"Organization"> | string | null
    }

    export type MemberWhereInput = {
        AND?: MemberWhereInput | MemberWhereInput[]
        OR?: MemberWhereInput[]
        NOT?: MemberWhereInput | MemberWhereInput[]
        id?: StringFilter<"Member"> | string
        organizationId?: StringFilter<"Member"> | string
        userId?: StringFilter<"Member"> | string
        role?: StringFilter<"Member"> | string
        createdAt?: DateTimeFilter<"Member"> | Date | string
        organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }

    export type MemberOrderByWithRelationInput = {
        id?: SortOrder
        organizationId?: SortOrder
        userId?: SortOrder
        role?: SortOrder
        createdAt?: SortOrder
        organization?: OrganizationOrderByWithRelationInput
        user?: UserOrderByWithRelationInput
        _relevance?: MemberOrderByRelevanceInput
    }

    export type MemberWhereUniqueInput = Prisma.AtLeast<{
        id?: string
        AND?: MemberWhereInput | MemberWhereInput[]
        OR?: MemberWhereInput[]
        NOT?: MemberWhereInput | MemberWhereInput[]
        organizationId?: StringFilter<"Member"> | string
        userId?: StringFilter<"Member"> | string
        role?: StringFilter<"Member"> | string
        createdAt?: DateTimeFilter<"Member"> | Date | string
        organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }, "id">

    export type MemberOrderByWithAggregationInput = {
        id?: SortOrder
        organizationId?: SortOrder
        userId?: SortOrder
        role?: SortOrder
        createdAt?: SortOrder
        _count?: MemberCountOrderByAggregateInput
        _max?: MemberMaxOrderByAggregateInput
        _min?: MemberMinOrderByAggregateInput
    }

    export type MemberScalarWhereWithAggregatesInput = {
        AND?: MemberScalarWhereWithAggregatesInput | MemberScalarWhereWithAggregatesInput[]
        OR?: MemberScalarWhereWithAggregatesInput[]
        NOT?: MemberScalarWhereWithAggregatesInput | MemberScalarWhereWithAggregatesInput[]
        id?: StringWithAggregatesFilter<"Member"> | string
        organizationId?: StringWithAggregatesFilter<"Member"> | string
        userId?: StringWithAggregatesFilter<"Member"> | string
        role?: StringWithAggregatesFilter<"Member"> | string
        createdAt?: DateTimeWithAggregatesFilter<"Member"> | Date | string
    }

    export type InvitationWhereInput = {
        AND?: InvitationWhereInput | InvitationWhereInput[]
        OR?: InvitationWhereInput[]
        NOT?: InvitationWhereInput | InvitationWhereInput[]
        id?: StringFilter<"Invitation"> | string
        organizationId?: StringFilter<"Invitation"> | string
        email?: StringFilter<"Invitation"> | string
        role?: StringNullableFilter<"Invitation"> | string | null
        status?: StringFilter<"Invitation"> | string
        expiresAt?: DateTimeFilter<"Invitation"> | Date | string
        inviterId?: StringFilter<"Invitation"> | string
        organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }

    export type InvitationOrderByWithRelationInput = {
        id?: SortOrder
        organizationId?: SortOrder
        email?: SortOrder
        role?: SortOrderInput | SortOrder
        status?: SortOrder
        expiresAt?: SortOrder
        inviterId?: SortOrder
        organization?: OrganizationOrderByWithRelationInput
        user?: UserOrderByWithRelationInput
        _relevance?: InvitationOrderByRelevanceInput
    }

    export type InvitationWhereUniqueInput = Prisma.AtLeast<{
        id?: string
        AND?: InvitationWhereInput | InvitationWhereInput[]
        OR?: InvitationWhereInput[]
        NOT?: InvitationWhereInput | InvitationWhereInput[]
        organizationId?: StringFilter<"Invitation"> | string
        email?: StringFilter<"Invitation"> | string
        role?: StringNullableFilter<"Invitation"> | string | null
        status?: StringFilter<"Invitation"> | string
        expiresAt?: DateTimeFilter<"Invitation"> | Date | string
        inviterId?: StringFilter<"Invitation"> | string
        organization?: XOR<OrganizationScalarRelationFilter, OrganizationWhereInput>
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }, "id">

    export type InvitationOrderByWithAggregationInput = {
        id?: SortOrder
        organizationId?: SortOrder
        email?: SortOrder
        role?: SortOrderInput | SortOrder
        status?: SortOrder
        expiresAt?: SortOrder
        inviterId?: SortOrder
        _count?: InvitationCountOrderByAggregateInput
        _max?: InvitationMaxOrderByAggregateInput
        _min?: InvitationMinOrderByAggregateInput
    }

    export type InvitationScalarWhereWithAggregatesInput = {
        AND?: InvitationScalarWhereWithAggregatesInput | InvitationScalarWhereWithAggregatesInput[]
        OR?: InvitationScalarWhereWithAggregatesInput[]
        NOT?: InvitationScalarWhereWithAggregatesInput | InvitationScalarWhereWithAggregatesInput[]
        id?: StringWithAggregatesFilter<"Invitation"> | string
        organizationId?: StringWithAggregatesFilter<"Invitation"> | string
        email?: StringWithAggregatesFilter<"Invitation"> | string
        role?: StringNullableWithAggregatesFilter<"Invitation"> | string | null
        status?: StringWithAggregatesFilter<"Invitation"> | string
        expiresAt?: DateTimeWithAggregatesFilter<"Invitation"> | Date | string
        inviterId?: StringWithAggregatesFilter<"Invitation"> | string
    }

    export type TwoFactorWhereInput = {
        AND?: TwoFactorWhereInput | TwoFactorWhereInput[]
        OR?: TwoFactorWhereInput[]
        NOT?: TwoFactorWhereInput | TwoFactorWhereInput[]
        id?: StringFilter<"TwoFactor"> | string
        secret?: StringFilter<"TwoFactor"> | string
        backupCodes?: StringFilter<"TwoFactor"> | string
        userId?: StringFilter<"TwoFactor"> | string
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }

    export type TwoFactorOrderByWithRelationInput = {
        id?: SortOrder
        secret?: SortOrder
        backupCodes?: SortOrder
        userId?: SortOrder
        user?: UserOrderByWithRelationInput
        _relevance?: TwoFactorOrderByRelevanceInput
    }

    export type TwoFactorWhereUniqueInput = Prisma.AtLeast<{
        id?: string
        AND?: TwoFactorWhereInput | TwoFactorWhereInput[]
        OR?: TwoFactorWhereInput[]
        NOT?: TwoFactorWhereInput | TwoFactorWhereInput[]
        secret?: StringFilter<"TwoFactor"> | string
        backupCodes?: StringFilter<"TwoFactor"> | string
        userId?: StringFilter<"TwoFactor"> | string
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }, "id">

    export type TwoFactorOrderByWithAggregationInput = {
        id?: SortOrder
        secret?: SortOrder
        backupCodes?: SortOrder
        userId?: SortOrder
        _count?: TwoFactorCountOrderByAggregateInput
        _max?: TwoFactorMaxOrderByAggregateInput
        _min?: TwoFactorMinOrderByAggregateInput
    }

    export type TwoFactorScalarWhereWithAggregatesInput = {
        AND?: TwoFactorScalarWhereWithAggregatesInput | TwoFactorScalarWhereWithAggregatesInput[]
        OR?: TwoFactorScalarWhereWithAggregatesInput[]
        NOT?: TwoFactorScalarWhereWithAggregatesInput | TwoFactorScalarWhereWithAggregatesInput[]
        id?: StringWithAggregatesFilter<"TwoFactor"> | string
        secret?: StringWithAggregatesFilter<"TwoFactor"> | string
        backupCodes?: StringWithAggregatesFilter<"TwoFactor"> | string
        userId?: StringWithAggregatesFilter<"TwoFactor"> | string
    }

    export type MessageWhereInput = {
        AND?: MessageWhereInput | MessageWhereInput[]
        OR?: MessageWhereInput[]
        NOT?: MessageWhereInput | MessageWhereInput[]
        id?: IntFilter<"Message"> | number
        createdAt?: DateTimeFilter<"Message"> | Date | string
        userId?: StringFilter<"Message"> | string
        channelId?: StringFilter<"Message"> | string
        content?: BytesFilter<"Message"> | Uint8Array
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }

    export type MessageOrderByWithRelationInput = {
        id?: SortOrder
        createdAt?: SortOrder
        userId?: SortOrder
        channelId?: SortOrder
        content?: SortOrder
        user?: UserOrderByWithRelationInput
        _relevance?: MessageOrderByRelevanceInput
    }

    export type MessageWhereUniqueInput = Prisma.AtLeast<{
        id?: number
        AND?: MessageWhereInput | MessageWhereInput[]
        OR?: MessageWhereInput[]
        NOT?: MessageWhereInput | MessageWhereInput[]
        createdAt?: DateTimeFilter<"Message"> | Date | string
        userId?: StringFilter<"Message"> | string
        channelId?: StringFilter<"Message"> | string
        content?: BytesFilter<"Message"> | Uint8Array
        user?: XOR<UserScalarRelationFilter, UserWhereInput>
    }, "id">

    export type MessageOrderByWithAggregationInput = {
        id?: SortOrder
        createdAt?: SortOrder
        userId?: SortOrder
        channelId?: SortOrder
        content?: SortOrder
        _count?: MessageCountOrderByAggregateInput
        _avg?: MessageAvgOrderByAggregateInput
        _max?: MessageMaxOrderByAggregateInput
        _min?: MessageMinOrderByAggregateInput
        _sum?: MessageSumOrderByAggregateInput
    }

    export type MessageScalarWhereWithAggregatesInput = {
        AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
        OR?: MessageScalarWhereWithAggregatesInput[]
        NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
        id?: IntWithAggregatesFilter<"Message"> | number
        createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
        userId?: StringWithAggregatesFilter<"Message"> | string
        channelId?: StringWithAggregatesFilter<"Message"> | string
        content?: BytesWithAggregatesFilter<"Message"> | Uint8Array
    }

  export type UserCreateInput = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date | string
    updatedAt: Date | string
      role?: string | null
      banned?: boolean | null
      banReason?: string | null
      banExpires?: Date | string | null
      twoFactorEnabled?: boolean | null
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
      messages?: MessageCreateNestedManyWithoutUserInput
      members?: MemberCreateNestedManyWithoutUserInput
      invitations?: InvitationCreateNestedManyWithoutUserInput
      twofactors?: TwoFactorCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date | string
    updatedAt: Date | string
      role?: string | null
      banned?: boolean | null
      banReason?: string | null
      banExpires?: Date | string | null
      twoFactorEnabled?: boolean | null
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
      messages?: MessageUncheckedCreateNestedManyWithoutUserInput
      members?: MemberUncheckedCreateNestedManyWithoutUserInput
      invitations?: InvitationUncheckedCreateNestedManyWithoutUserInput
      twofactors?: TwoFactorUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
      messages?: MessageUpdateManyWithoutUserNestedInput
      members?: MemberUpdateManyWithoutUserNestedInput
      invitations?: InvitationUpdateManyWithoutUserNestedInput
      twofactors?: TwoFactorUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
      messages?: MessageUncheckedUpdateManyWithoutUserNestedInput
      members?: MemberUncheckedUpdateManyWithoutUserNestedInput
      invitations?: InvitationUncheckedUpdateManyWithoutUserNestedInput
      twofactors?: TwoFactorUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date | string
    updatedAt: Date | string
      role?: string | null
      banned?: boolean | null
      banReason?: string | null
      banExpires?: Date | string | null
      twoFactorEnabled?: boolean | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
  }

  export type SessionCreateInput = {
    id: string
    expiresAt: Date | string
    token: string
    createdAt: Date | string
    updatedAt: Date | string
    ipAddress?: string | null
    userAgent?: string | null
      impersonatedBy?: string | null
      activeOrganizationId?: string | null
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateInput = {
    id: string
    expiresAt: Date | string
    token: string
    createdAt: Date | string
    updatedAt: Date | string
    ipAddress?: string | null
    userAgent?: string | null
    userId: string
      impersonatedBy?: string | null
      activeOrganizationId?: string | null
  }

  export type SessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
      impersonatedBy?: NullableStringFieldUpdateOperationsInput | string | null
      activeOrganizationId?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
      impersonatedBy?: NullableStringFieldUpdateOperationsInput | string | null
      activeOrganizationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionCreateManyInput = {
    id: string
    expiresAt: Date | string
    token: string
    createdAt: Date | string
    updatedAt: Date | string
    ipAddress?: string | null
    userAgent?: string | null
    userId: string
      impersonatedBy?: string | null
      activeOrganizationId?: string | null
  }

  export type SessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
      impersonatedBy?: NullableStringFieldUpdateOperationsInput | string | null
      activeOrganizationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
      impersonatedBy?: NullableStringFieldUpdateOperationsInput | string | null
      activeOrganizationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AccountCreateInput = {
    id: string
    accountId: string
    providerId: string
    accessToken?: string | null
    refreshToken?: string | null
    idToken?: string | null
    accessTokenExpiresAt?: Date | string | null
    refreshTokenExpiresAt?: Date | string | null
    scope?: string | null
    password?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    user: UserCreateNestedOneWithoutAccountsInput
  }

  export type AccountUncheckedCreateInput = {
    id: string
    accountId: string
    providerId: string
    userId: string
    accessToken?: string | null
    refreshToken?: string | null
    idToken?: string | null
    accessTokenExpiresAt?: Date | string | null
    refreshTokenExpiresAt?: Date | string | null
    scope?: string | null
    password?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type AccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountId?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    idToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refreshTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutAccountsNestedInput
  }

  export type AccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountId?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    idToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refreshTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountCreateManyInput = {
    id: string
    accountId: string
    providerId: string
    userId: string
    accessToken?: string | null
    refreshToken?: string | null
    idToken?: string | null
    accessTokenExpiresAt?: Date | string | null
    refreshTokenExpiresAt?: Date | string | null
    scope?: string | null
    password?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type AccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountId?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    idToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refreshTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountId?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    idToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refreshTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationCreateInput = {
    id: string
    identifier: string
    value: string
    expiresAt: Date | string
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
  }

  export type VerificationUncheckedCreateInput = {
    id: string
    identifier: string
    value: string
    expiresAt: Date | string
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
  }

  export type VerificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type VerificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type VerificationCreateManyInput = {
    id: string
    identifier: string
    value: string
    expiresAt: Date | string
    createdAt?: Date | string | null
    updatedAt?: Date | string | null
  }

  export type VerificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type VerificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

    export type OrganizationCreateInput = {
        id: string
        name: string
        slug?: string | null
        logo?: string | null
        createdAt: Date | string
        metadata?: string | null
        members?: MemberCreateNestedManyWithoutOrganizationInput
        invitations?: InvitationCreateNestedManyWithoutOrganizationInput
    }

    export type OrganizationUncheckedCreateInput = {
        id: string
        name: string
        slug?: string | null
        logo?: string | null
        createdAt: Date | string
        metadata?: string | null
        members?: MemberUncheckedCreateNestedManyWithoutOrganizationInput
        invitations?: InvitationUncheckedCreateNestedManyWithoutOrganizationInput
    }

    export type OrganizationUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
        members?: MemberUpdateManyWithoutOrganizationNestedInput
        invitations?: InvitationUpdateManyWithoutOrganizationNestedInput
    }

    export type OrganizationUncheckedUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
        members?: MemberUncheckedUpdateManyWithoutOrganizationNestedInput
        invitations?: InvitationUncheckedUpdateManyWithoutOrganizationNestedInput
    }

    export type OrganizationCreateManyInput = {
        id: string
        name: string
        slug?: string | null
        logo?: string | null
        createdAt: Date | string
        metadata?: string | null
    }

    export type OrganizationUpdateManyMutationInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
    }

    export type OrganizationUncheckedUpdateManyInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
    }

    export type MemberCreateInput = {
        id: string
        role: string
        createdAt: Date | string
        organization: OrganizationCreateNestedOneWithoutMembersInput
        user: UserCreateNestedOneWithoutMembersInput
    }

    export type MemberUncheckedCreateInput = {
        id: string
        organizationId: string
        userId: string
        role: string
        createdAt: Date | string
    }

    export type MemberUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        organization?: OrganizationUpdateOneRequiredWithoutMembersNestedInput
        user?: UserUpdateOneRequiredWithoutMembersNestedInput
    }

    export type MemberUncheckedUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        userId?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type MemberCreateManyInput = {
        id: string
        organizationId: string
        userId: string
        role: string
        createdAt: Date | string
    }

    export type MemberUpdateManyMutationInput = {
        id?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type MemberUncheckedUpdateManyInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        userId?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type InvitationCreateInput = {
        id: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
        organization: OrganizationCreateNestedOneWithoutInvitationsInput
        user: UserCreateNestedOneWithoutInvitationsInput
    }

    export type InvitationUncheckedCreateInput = {
        id: string
        organizationId: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
        inviterId: string
    }

    export type InvitationUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
        organization?: OrganizationUpdateOneRequiredWithoutInvitationsNestedInput
        user?: UserUpdateOneRequiredWithoutInvitationsNestedInput
    }

    export type InvitationUncheckedUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
        inviterId?: StringFieldUpdateOperationsInput | string
    }

    export type InvitationCreateManyInput = {
        id: string
        organizationId: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
        inviterId: string
    }

    export type InvitationUpdateManyMutationInput = {
        id?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type InvitationUncheckedUpdateManyInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
        inviterId?: StringFieldUpdateOperationsInput | string
    }

    export type TwoFactorCreateInput = {
        id: string
        secret: string
        backupCodes: string
        user: UserCreateNestedOneWithoutTwofactorsInput
    }

    export type TwoFactorUncheckedCreateInput = {
        id: string
        secret: string
        backupCodes: string
        userId: string
    }

    export type TwoFactorUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        secret?: StringFieldUpdateOperationsInput | string
        backupCodes?: StringFieldUpdateOperationsInput | string
        user?: UserUpdateOneRequiredWithoutTwofactorsNestedInput
    }

    export type TwoFactorUncheckedUpdateInput = {
        id?: StringFieldUpdateOperationsInput | string
        secret?: StringFieldUpdateOperationsInput | string
        backupCodes?: StringFieldUpdateOperationsInput | string
        userId?: StringFieldUpdateOperationsInput | string
    }

    export type TwoFactorCreateManyInput = {
        id: string
        secret: string
        backupCodes: string
        userId: string
    }

    export type TwoFactorUpdateManyMutationInput = {
        id?: StringFieldUpdateOperationsInput | string
        secret?: StringFieldUpdateOperationsInput | string
        backupCodes?: StringFieldUpdateOperationsInput | string
    }

    export type TwoFactorUncheckedUpdateManyInput = {
        id?: StringFieldUpdateOperationsInput | string
        secret?: StringFieldUpdateOperationsInput | string
        backupCodes?: StringFieldUpdateOperationsInput | string
        userId?: StringFieldUpdateOperationsInput | string
    }

    export type MessageCreateInput = {
        createdAt: Date | string
        channelId: string
        content: Uint8Array
        user: UserCreateNestedOneWithoutMessagesInput
    }

    export type MessageUncheckedCreateInput = {
        id?: number
        createdAt: Date | string
        userId: string
        channelId: string
        content: Uint8Array
    }

    export type MessageUpdateInput = {
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        channelId?: StringFieldUpdateOperationsInput | string
        content?: BytesFieldUpdateOperationsInput | Uint8Array
        user?: UserUpdateOneRequiredWithoutMessagesNestedInput
    }

    export type MessageUncheckedUpdateInput = {
        id?: IntFieldUpdateOperationsInput | number
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        userId?: StringFieldUpdateOperationsInput | string
        channelId?: StringFieldUpdateOperationsInput | string
        content?: BytesFieldUpdateOperationsInput | Uint8Array
    }

    export type MessageCreateManyInput = {
        id?: number
        createdAt: Date | string
        userId: string
        channelId: string
        content: Uint8Array
    }

    export type MessageUpdateManyMutationInput = {
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        channelId?: StringFieldUpdateOperationsInput | string
        content?: BytesFieldUpdateOperationsInput | Uint8Array
    }

    export type MessageUncheckedUpdateManyInput = {
        id?: IntFieldUpdateOperationsInput | number
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        userId?: StringFieldUpdateOperationsInput | string
        channelId?: StringFieldUpdateOperationsInput | string
        content?: BytesFieldUpdateOperationsInput | Uint8Array
    }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

    export type BoolNullableFilter<$PrismaModel = never> = {
        equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
        not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
    }

    export type DateTimeNullableFilter<$PrismaModel = never> = {
        equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
        in?: Date[] | string[] | null
        notIn?: Date[] | string[] | null
        lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
    }

  export type AccountListRelationFilter = {
    every?: AccountWhereInput
    some?: AccountWhereInput
    none?: AccountWhereInput
  }

  export type SessionListRelationFilter = {
    every?: SessionWhereInput
    some?: SessionWhereInput
    none?: SessionWhereInput
  }

    export type MessageListRelationFilter = {
        every?: MessageWhereInput
        some?: MessageWhereInput
        none?: MessageWhereInput
    }

    export type MemberListRelationFilter = {
        every?: MemberWhereInput
        some?: MemberWhereInput
        none?: MemberWhereInput
    }

    export type InvitationListRelationFilter = {
        every?: InvitationWhereInput
        some?: InvitationWhereInput
        none?: InvitationWhereInput
    }

    export type TwoFactorListRelationFilter = {
        every?: TwoFactorWhereInput
        some?: TwoFactorWhereInput
        none?: TwoFactorWhereInput
    }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AccountOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

    export type MessageOrderByRelationAggregateInput = {
        _count?: SortOrder
    }

    export type MemberOrderByRelationAggregateInput = {
        _count?: SortOrder
    }

    export type InvitationOrderByRelationAggregateInput = {
        _count?: SortOrder
    }

    export type TwoFactorOrderByRelationAggregateInput = {
        _count?: SortOrder
    }

  export type UserOrderByRelevanceInput = {
    fields: UserOrderByRelevanceFieldEnum | UserOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
      role?: SortOrder
      banned?: SortOrder
      banReason?: SortOrder
      banExpires?: SortOrder
      twoFactorEnabled?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
      role?: SortOrder
      banned?: SortOrder
      banReason?: SortOrder
      banExpires?: SortOrder
      twoFactorEnabled?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
      role?: SortOrder
      banned?: SortOrder
      banReason?: SortOrder
      banExpires?: SortOrder
      twoFactorEnabled?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

    export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
        equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
        not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
        _count?: NestedIntNullableFilter<$PrismaModel>
        _min?: NestedBoolNullableFilter<$PrismaModel>
        _max?: NestedBoolNullableFilter<$PrismaModel>
    }

    export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
        equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
        in?: Date[] | string[] | null
        notIn?: Date[] | string[] | null
        lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
        _count?: NestedIntNullableFilter<$PrismaModel>
        _min?: NestedDateTimeNullableFilter<$PrismaModel>
        _max?: NestedDateTimeNullableFilter<$PrismaModel>
    }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type SessionOrderByRelevanceInput = {
    fields: SessionOrderByRelevanceFieldEnum | SessionOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type SessionCountOrderByAggregateInput = {
    id?: SortOrder
    expiresAt?: SortOrder
    token?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    userId?: SortOrder
      impersonatedBy?: SortOrder
      activeOrganizationId?: SortOrder
  }

  export type SessionMaxOrderByAggregateInput = {
    id?: SortOrder
    expiresAt?: SortOrder
    token?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    userId?: SortOrder
      impersonatedBy?: SortOrder
      activeOrganizationId?: SortOrder
  }

  export type SessionMinOrderByAggregateInput = {
    id?: SortOrder
    expiresAt?: SortOrder
    token?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    userId?: SortOrder
      impersonatedBy?: SortOrder
      activeOrganizationId?: SortOrder
  }

  export type AccountOrderByRelevanceInput = {
    fields: AccountOrderByRelevanceFieldEnum | AccountOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type AccountCountOrderByAggregateInput = {
    id?: SortOrder
    accountId?: SortOrder
    providerId?: SortOrder
    userId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    idToken?: SortOrder
    accessTokenExpiresAt?: SortOrder
    refreshTokenExpiresAt?: SortOrder
    scope?: SortOrder
    password?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AccountMaxOrderByAggregateInput = {
    id?: SortOrder
    accountId?: SortOrder
    providerId?: SortOrder
    userId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    idToken?: SortOrder
    accessTokenExpiresAt?: SortOrder
    refreshTokenExpiresAt?: SortOrder
    scope?: SortOrder
    password?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AccountMinOrderByAggregateInput = {
    id?: SortOrder
    accountId?: SortOrder
    providerId?: SortOrder
    userId?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    idToken?: SortOrder
    accessTokenExpiresAt?: SortOrder
    refreshTokenExpiresAt?: SortOrder
    scope?: SortOrder
    password?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationOrderByRelevanceInput = {
    fields: VerificationOrderByRelevanceFieldEnum | VerificationOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type VerificationCountOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    value?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationMaxOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    value?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationMinOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    value?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

    export type OrganizationOrderByRelevanceInput = {
        fields: OrganizationOrderByRelevanceFieldEnum | OrganizationOrderByRelevanceFieldEnum[]
        sort: SortOrder
        search: string
    }

    export type OrganizationCountOrderByAggregateInput = {
        id?: SortOrder
        name?: SortOrder
        slug?: SortOrder
        logo?: SortOrder
        createdAt?: SortOrder
        metadata?: SortOrder
    }

    export type OrganizationMaxOrderByAggregateInput = {
        id?: SortOrder
        name?: SortOrder
        slug?: SortOrder
        logo?: SortOrder
        createdAt?: SortOrder
        metadata?: SortOrder
    }

    export type OrganizationMinOrderByAggregateInput = {
        id?: SortOrder
        name?: SortOrder
        slug?: SortOrder
        logo?: SortOrder
        createdAt?: SortOrder
        metadata?: SortOrder
    }

    export type OrganizationScalarRelationFilter = {
        is?: OrganizationWhereInput
        isNot?: OrganizationWhereInput
    }

    export type MemberOrderByRelevanceInput = {
        fields: MemberOrderByRelevanceFieldEnum | MemberOrderByRelevanceFieldEnum[]
        sort: SortOrder
        search: string
    }

    export type MemberCountOrderByAggregateInput = {
        id?: SortOrder
        organizationId?: SortOrder
        userId?: SortOrder
        role?: SortOrder
        createdAt?: SortOrder
    }

    export type MemberMaxOrderByAggregateInput = {
        id?: SortOrder
        organizationId?: SortOrder
        userId?: SortOrder
        role?: SortOrder
        createdAt?: SortOrder
    }

    export type MemberMinOrderByAggregateInput = {
        id?: SortOrder
        organizationId?: SortOrder
        userId?: SortOrder
        role?: SortOrder
        createdAt?: SortOrder
    }

    export type InvitationOrderByRelevanceInput = {
        fields: InvitationOrderByRelevanceFieldEnum | InvitationOrderByRelevanceFieldEnum[]
        sort: SortOrder
        search: string
    }

    export type InvitationCountOrderByAggregateInput = {
        id?: SortOrder
        organizationId?: SortOrder
        email?: SortOrder
        role?: SortOrder
        status?: SortOrder
        expiresAt?: SortOrder
        inviterId?: SortOrder
    }

    export type InvitationMaxOrderByAggregateInput = {
        id?: SortOrder
        organizationId?: SortOrder
        email?: SortOrder
        role?: SortOrder
        status?: SortOrder
        expiresAt?: SortOrder
        inviterId?: SortOrder
    }

    export type InvitationMinOrderByAggregateInput = {
        id?: SortOrder
        organizationId?: SortOrder
        email?: SortOrder
        role?: SortOrder
        status?: SortOrder
        expiresAt?: SortOrder
        inviterId?: SortOrder
    }

    export type TwoFactorOrderByRelevanceInput = {
        fields: TwoFactorOrderByRelevanceFieldEnum | TwoFactorOrderByRelevanceFieldEnum[]
        sort: SortOrder
        search: string
    }

    export type TwoFactorCountOrderByAggregateInput = {
        id?: SortOrder
        secret?: SortOrder
        backupCodes?: SortOrder
        userId?: SortOrder
    }

    export type TwoFactorMaxOrderByAggregateInput = {
        id?: SortOrder
        secret?: SortOrder
        backupCodes?: SortOrder
        userId?: SortOrder
    }

    export type TwoFactorMinOrderByAggregateInput = {
        id?: SortOrder
        secret?: SortOrder
        backupCodes?: SortOrder
        userId?: SortOrder
    }

    export type IntFilter<$PrismaModel = never> = {
        equals?: number | IntFieldRefInput<$PrismaModel>
        in?: number[]
        notIn?: number[]
        lt?: number | IntFieldRefInput<$PrismaModel>
        lte?: number | IntFieldRefInput<$PrismaModel>
        gt?: number | IntFieldRefInput<$PrismaModel>
        gte?: number | IntFieldRefInput<$PrismaModel>
        not?: NestedIntFilter<$PrismaModel> | number
    }

    export type BytesFilter<$PrismaModel = never> = {
        equals?: Uint8Array | BytesFieldRefInput<$PrismaModel>
        in?: Uint8Array[]
        notIn?: Uint8Array[]
        not?: NestedBytesFilter<$PrismaModel> | Uint8Array
    }

    export type MessageOrderByRelevanceInput = {
        fields: MessageOrderByRelevanceFieldEnum | MessageOrderByRelevanceFieldEnum[]
        sort: SortOrder
        search: string
    }

    export type MessageCountOrderByAggregateInput = {
        id?: SortOrder
        createdAt?: SortOrder
        userId?: SortOrder
        channelId?: SortOrder
        content?: SortOrder
    }

    export type MessageAvgOrderByAggregateInput = {
        id?: SortOrder
    }

    export type MessageMaxOrderByAggregateInput = {
        id?: SortOrder
        createdAt?: SortOrder
        userId?: SortOrder
        channelId?: SortOrder
        content?: SortOrder
    }

    export type MessageMinOrderByAggregateInput = {
        id?: SortOrder
        createdAt?: SortOrder
        userId?: SortOrder
        channelId?: SortOrder
        content?: SortOrder
    }

    export type MessageSumOrderByAggregateInput = {
        id?: SortOrder
    }

    export type IntWithAggregatesFilter<$PrismaModel = never> = {
        equals?: number | IntFieldRefInput<$PrismaModel>
        in?: number[]
        notIn?: number[]
        lt?: number | IntFieldRefInput<$PrismaModel>
        lte?: number | IntFieldRefInput<$PrismaModel>
        gt?: number | IntFieldRefInput<$PrismaModel>
        gte?: number | IntFieldRefInput<$PrismaModel>
        not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
        _count?: NestedIntFilter<$PrismaModel>
        _avg?: NestedFloatFilter<$PrismaModel>
        _sum?: NestedIntFilter<$PrismaModel>
        _min?: NestedIntFilter<$PrismaModel>
        _max?: NestedIntFilter<$PrismaModel>
    }

    export type BytesWithAggregatesFilter<$PrismaModel = never> = {
        equals?: Uint8Array | BytesFieldRefInput<$PrismaModel>
        in?: Uint8Array[]
        notIn?: Uint8Array[]
        not?: NestedBytesWithAggregatesFilter<$PrismaModel> | Uint8Array
        _count?: NestedIntFilter<$PrismaModel>
        _min?: NestedBytesFilter<$PrismaModel>
        _max?: NestedBytesFilter<$PrismaModel>
    }

  export type AccountCreateNestedManyWithoutUserInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
  }

  export type SessionCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

    export type MessageCreateNestedManyWithoutUserInput = {
        create?: XOR<MessageCreateWithoutUserInput, MessageUncheckedCreateWithoutUserInput> | MessageCreateWithoutUserInput[] | MessageUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MessageCreateOrConnectWithoutUserInput | MessageCreateOrConnectWithoutUserInput[]
        createMany?: MessageCreateManyUserInputEnvelope
        connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    }

    export type MemberCreateNestedManyWithoutUserInput = {
        create?: XOR<MemberCreateWithoutUserInput, MemberUncheckedCreateWithoutUserInput> | MemberCreateWithoutUserInput[] | MemberUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutUserInput | MemberCreateOrConnectWithoutUserInput[]
        createMany?: MemberCreateManyUserInputEnvelope
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
    }

    export type InvitationCreateNestedManyWithoutUserInput = {
        create?: XOR<InvitationCreateWithoutUserInput, InvitationUncheckedCreateWithoutUserInput> | InvitationCreateWithoutUserInput[] | InvitationUncheckedCreateWithoutUserInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutUserInput | InvitationCreateOrConnectWithoutUserInput[]
        createMany?: InvitationCreateManyUserInputEnvelope
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
    }

    export type TwoFactorCreateNestedManyWithoutUserInput = {
        create?: XOR<TwoFactorCreateWithoutUserInput, TwoFactorUncheckedCreateWithoutUserInput> | TwoFactorCreateWithoutUserInput[] | TwoFactorUncheckedCreateWithoutUserInput[]
        connectOrCreate?: TwoFactorCreateOrConnectWithoutUserInput | TwoFactorCreateOrConnectWithoutUserInput[]
        createMany?: TwoFactorCreateManyUserInputEnvelope
        connect?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
    }

  export type AccountUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
  }

  export type SessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

    export type MessageUncheckedCreateNestedManyWithoutUserInput = {
        create?: XOR<MessageCreateWithoutUserInput, MessageUncheckedCreateWithoutUserInput> | MessageCreateWithoutUserInput[] | MessageUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MessageCreateOrConnectWithoutUserInput | MessageCreateOrConnectWithoutUserInput[]
        createMany?: MessageCreateManyUserInputEnvelope
        connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    }

    export type MemberUncheckedCreateNestedManyWithoutUserInput = {
        create?: XOR<MemberCreateWithoutUserInput, MemberUncheckedCreateWithoutUserInput> | MemberCreateWithoutUserInput[] | MemberUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutUserInput | MemberCreateOrConnectWithoutUserInput[]
        createMany?: MemberCreateManyUserInputEnvelope
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
    }

    export type InvitationUncheckedCreateNestedManyWithoutUserInput = {
        create?: XOR<InvitationCreateWithoutUserInput, InvitationUncheckedCreateWithoutUserInput> | InvitationCreateWithoutUserInput[] | InvitationUncheckedCreateWithoutUserInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutUserInput | InvitationCreateOrConnectWithoutUserInput[]
        createMany?: InvitationCreateManyUserInputEnvelope
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
    }

    export type TwoFactorUncheckedCreateNestedManyWithoutUserInput = {
        create?: XOR<TwoFactorCreateWithoutUserInput, TwoFactorUncheckedCreateWithoutUserInput> | TwoFactorCreateWithoutUserInput[] | TwoFactorUncheckedCreateWithoutUserInput[]
        connectOrCreate?: TwoFactorCreateOrConnectWithoutUserInput | TwoFactorCreateOrConnectWithoutUserInput[]
        createMany?: TwoFactorCreateManyUserInputEnvelope
        connect?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
    }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

    export type NullableBoolFieldUpdateOperationsInput = {
        set?: boolean | null
    }

    export type NullableDateTimeFieldUpdateOperationsInput = {
        set?: Date | string | null
    }

  export type AccountUpdateManyWithoutUserNestedInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    upsert?: AccountUpsertWithWhereUniqueWithoutUserInput | AccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    update?: AccountUpdateWithWhereUniqueWithoutUserInput | AccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AccountUpdateManyWithWhereWithoutUserInput | AccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[]
  }

  export type SessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

    export type MessageUpdateManyWithoutUserNestedInput = {
        create?: XOR<MessageCreateWithoutUserInput, MessageUncheckedCreateWithoutUserInput> | MessageCreateWithoutUserInput[] | MessageUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MessageCreateOrConnectWithoutUserInput | MessageCreateOrConnectWithoutUserInput[]
        upsert?: MessageUpsertWithWhereUniqueWithoutUserInput | MessageUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: MessageCreateManyUserInputEnvelope
        set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        update?: MessageUpdateWithWhereUniqueWithoutUserInput | MessageUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: MessageUpdateManyWithWhereWithoutUserInput | MessageUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
    }

    export type MemberUpdateManyWithoutUserNestedInput = {
        create?: XOR<MemberCreateWithoutUserInput, MemberUncheckedCreateWithoutUserInput> | MemberCreateWithoutUserInput[] | MemberUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutUserInput | MemberCreateOrConnectWithoutUserInput[]
        upsert?: MemberUpsertWithWhereUniqueWithoutUserInput | MemberUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: MemberCreateManyUserInputEnvelope
        set?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        disconnect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        delete?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        update?: MemberUpdateWithWhereUniqueWithoutUserInput | MemberUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: MemberUpdateManyWithWhereWithoutUserInput | MemberUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: MemberScalarWhereInput | MemberScalarWhereInput[]
    }

    export type InvitationUpdateManyWithoutUserNestedInput = {
        create?: XOR<InvitationCreateWithoutUserInput, InvitationUncheckedCreateWithoutUserInput> | InvitationCreateWithoutUserInput[] | InvitationUncheckedCreateWithoutUserInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutUserInput | InvitationCreateOrConnectWithoutUserInput[]
        upsert?: InvitationUpsertWithWhereUniqueWithoutUserInput | InvitationUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: InvitationCreateManyUserInputEnvelope
        set?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        disconnect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        delete?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        update?: InvitationUpdateWithWhereUniqueWithoutUserInput | InvitationUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: InvitationUpdateManyWithWhereWithoutUserInput | InvitationUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: InvitationScalarWhereInput | InvitationScalarWhereInput[]
    }

    export type TwoFactorUpdateManyWithoutUserNestedInput = {
        create?: XOR<TwoFactorCreateWithoutUserInput, TwoFactorUncheckedCreateWithoutUserInput> | TwoFactorCreateWithoutUserInput[] | TwoFactorUncheckedCreateWithoutUserInput[]
        connectOrCreate?: TwoFactorCreateOrConnectWithoutUserInput | TwoFactorCreateOrConnectWithoutUserInput[]
        upsert?: TwoFactorUpsertWithWhereUniqueWithoutUserInput | TwoFactorUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: TwoFactorCreateManyUserInputEnvelope
        set?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        disconnect?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        delete?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        connect?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        update?: TwoFactorUpdateWithWhereUniqueWithoutUserInput | TwoFactorUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: TwoFactorUpdateManyWithWhereWithoutUserInput | TwoFactorUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: TwoFactorScalarWhereInput | TwoFactorScalarWhereInput[]
    }

  export type AccountUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    upsert?: AccountUpsertWithWhereUniqueWithoutUserInput | AccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    update?: AccountUpdateWithWhereUniqueWithoutUserInput | AccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AccountUpdateManyWithWhereWithoutUserInput | AccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[]
  }

  export type SessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

    export type MessageUncheckedUpdateManyWithoutUserNestedInput = {
        create?: XOR<MessageCreateWithoutUserInput, MessageUncheckedCreateWithoutUserInput> | MessageCreateWithoutUserInput[] | MessageUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MessageCreateOrConnectWithoutUserInput | MessageCreateOrConnectWithoutUserInput[]
        upsert?: MessageUpsertWithWhereUniqueWithoutUserInput | MessageUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: MessageCreateManyUserInputEnvelope
        set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
        update?: MessageUpdateWithWhereUniqueWithoutUserInput | MessageUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: MessageUpdateManyWithWhereWithoutUserInput | MessageUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
    }

    export type MemberUncheckedUpdateManyWithoutUserNestedInput = {
        create?: XOR<MemberCreateWithoutUserInput, MemberUncheckedCreateWithoutUserInput> | MemberCreateWithoutUserInput[] | MemberUncheckedCreateWithoutUserInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutUserInput | MemberCreateOrConnectWithoutUserInput[]
        upsert?: MemberUpsertWithWhereUniqueWithoutUserInput | MemberUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: MemberCreateManyUserInputEnvelope
        set?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        disconnect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        delete?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        update?: MemberUpdateWithWhereUniqueWithoutUserInput | MemberUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: MemberUpdateManyWithWhereWithoutUserInput | MemberUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: MemberScalarWhereInput | MemberScalarWhereInput[]
    }

    export type InvitationUncheckedUpdateManyWithoutUserNestedInput = {
        create?: XOR<InvitationCreateWithoutUserInput, InvitationUncheckedCreateWithoutUserInput> | InvitationCreateWithoutUserInput[] | InvitationUncheckedCreateWithoutUserInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutUserInput | InvitationCreateOrConnectWithoutUserInput[]
        upsert?: InvitationUpsertWithWhereUniqueWithoutUserInput | InvitationUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: InvitationCreateManyUserInputEnvelope
        set?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        disconnect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        delete?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        update?: InvitationUpdateWithWhereUniqueWithoutUserInput | InvitationUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: InvitationUpdateManyWithWhereWithoutUserInput | InvitationUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: InvitationScalarWhereInput | InvitationScalarWhereInput[]
    }

    export type TwoFactorUncheckedUpdateManyWithoutUserNestedInput = {
        create?: XOR<TwoFactorCreateWithoutUserInput, TwoFactorUncheckedCreateWithoutUserInput> | TwoFactorCreateWithoutUserInput[] | TwoFactorUncheckedCreateWithoutUserInput[]
        connectOrCreate?: TwoFactorCreateOrConnectWithoutUserInput | TwoFactorCreateOrConnectWithoutUserInput[]
        upsert?: TwoFactorUpsertWithWhereUniqueWithoutUserInput | TwoFactorUpsertWithWhereUniqueWithoutUserInput[]
        createMany?: TwoFactorCreateManyUserInputEnvelope
        set?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        disconnect?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        delete?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        connect?: TwoFactorWhereUniqueInput | TwoFactorWhereUniqueInput[]
        update?: TwoFactorUpdateWithWhereUniqueWithoutUserInput | TwoFactorUpdateWithWhereUniqueWithoutUserInput[]
        updateMany?: TwoFactorUpdateManyWithWhereWithoutUserInput | TwoFactorUpdateManyWithWhereWithoutUserInput[]
        deleteMany?: TwoFactorScalarWhereInput | TwoFactorScalarWhereInput[]
    }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserCreateNestedOneWithoutAccountsInput = {
    create?: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAccountsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutAccountsNestedInput = {
    create?: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAccountsInput
    upsert?: UserUpsertWithoutAccountsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAccountsInput, UserUpdateWithoutAccountsInput>, UserUncheckedUpdateWithoutAccountsInput>
  }

    export type MemberCreateNestedManyWithoutOrganizationInput = {
        create?: XOR<MemberCreateWithoutOrganizationInput, MemberUncheckedCreateWithoutOrganizationInput> | MemberCreateWithoutOrganizationInput[] | MemberUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutOrganizationInput | MemberCreateOrConnectWithoutOrganizationInput[]
        createMany?: MemberCreateManyOrganizationInputEnvelope
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
    }

    export type InvitationCreateNestedManyWithoutOrganizationInput = {
        create?: XOR<InvitationCreateWithoutOrganizationInput, InvitationUncheckedCreateWithoutOrganizationInput> | InvitationCreateWithoutOrganizationInput[] | InvitationUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutOrganizationInput | InvitationCreateOrConnectWithoutOrganizationInput[]
        createMany?: InvitationCreateManyOrganizationInputEnvelope
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
    }

    export type MemberUncheckedCreateNestedManyWithoutOrganizationInput = {
        create?: XOR<MemberCreateWithoutOrganizationInput, MemberUncheckedCreateWithoutOrganizationInput> | MemberCreateWithoutOrganizationInput[] | MemberUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutOrganizationInput | MemberCreateOrConnectWithoutOrganizationInput[]
        createMany?: MemberCreateManyOrganizationInputEnvelope
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
    }

    export type InvitationUncheckedCreateNestedManyWithoutOrganizationInput = {
        create?: XOR<InvitationCreateWithoutOrganizationInput, InvitationUncheckedCreateWithoutOrganizationInput> | InvitationCreateWithoutOrganizationInput[] | InvitationUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutOrganizationInput | InvitationCreateOrConnectWithoutOrganizationInput[]
        createMany?: InvitationCreateManyOrganizationInputEnvelope
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
    }

    export type MemberUpdateManyWithoutOrganizationNestedInput = {
        create?: XOR<MemberCreateWithoutOrganizationInput, MemberUncheckedCreateWithoutOrganizationInput> | MemberCreateWithoutOrganizationInput[] | MemberUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutOrganizationInput | MemberCreateOrConnectWithoutOrganizationInput[]
        upsert?: MemberUpsertWithWhereUniqueWithoutOrganizationInput | MemberUpsertWithWhereUniqueWithoutOrganizationInput[]
        createMany?: MemberCreateManyOrganizationInputEnvelope
        set?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        disconnect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        delete?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        update?: MemberUpdateWithWhereUniqueWithoutOrganizationInput | MemberUpdateWithWhereUniqueWithoutOrganizationInput[]
        updateMany?: MemberUpdateManyWithWhereWithoutOrganizationInput | MemberUpdateManyWithWhereWithoutOrganizationInput[]
        deleteMany?: MemberScalarWhereInput | MemberScalarWhereInput[]
    }

    export type InvitationUpdateManyWithoutOrganizationNestedInput = {
        create?: XOR<InvitationCreateWithoutOrganizationInput, InvitationUncheckedCreateWithoutOrganizationInput> | InvitationCreateWithoutOrganizationInput[] | InvitationUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutOrganizationInput | InvitationCreateOrConnectWithoutOrganizationInput[]
        upsert?: InvitationUpsertWithWhereUniqueWithoutOrganizationInput | InvitationUpsertWithWhereUniqueWithoutOrganizationInput[]
        createMany?: InvitationCreateManyOrganizationInputEnvelope
        set?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        disconnect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        delete?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        update?: InvitationUpdateWithWhereUniqueWithoutOrganizationInput | InvitationUpdateWithWhereUniqueWithoutOrganizationInput[]
        updateMany?: InvitationUpdateManyWithWhereWithoutOrganizationInput | InvitationUpdateManyWithWhereWithoutOrganizationInput[]
        deleteMany?: InvitationScalarWhereInput | InvitationScalarWhereInput[]
    }

    export type MemberUncheckedUpdateManyWithoutOrganizationNestedInput = {
        create?: XOR<MemberCreateWithoutOrganizationInput, MemberUncheckedCreateWithoutOrganizationInput> | MemberCreateWithoutOrganizationInput[] | MemberUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: MemberCreateOrConnectWithoutOrganizationInput | MemberCreateOrConnectWithoutOrganizationInput[]
        upsert?: MemberUpsertWithWhereUniqueWithoutOrganizationInput | MemberUpsertWithWhereUniqueWithoutOrganizationInput[]
        createMany?: MemberCreateManyOrganizationInputEnvelope
        set?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        disconnect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        delete?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        connect?: MemberWhereUniqueInput | MemberWhereUniqueInput[]
        update?: MemberUpdateWithWhereUniqueWithoutOrganizationInput | MemberUpdateWithWhereUniqueWithoutOrganizationInput[]
        updateMany?: MemberUpdateManyWithWhereWithoutOrganizationInput | MemberUpdateManyWithWhereWithoutOrganizationInput[]
        deleteMany?: MemberScalarWhereInput | MemberScalarWhereInput[]
    }

    export type InvitationUncheckedUpdateManyWithoutOrganizationNestedInput = {
        create?: XOR<InvitationCreateWithoutOrganizationInput, InvitationUncheckedCreateWithoutOrganizationInput> | InvitationCreateWithoutOrganizationInput[] | InvitationUncheckedCreateWithoutOrganizationInput[]
        connectOrCreate?: InvitationCreateOrConnectWithoutOrganizationInput | InvitationCreateOrConnectWithoutOrganizationInput[]
        upsert?: InvitationUpsertWithWhereUniqueWithoutOrganizationInput | InvitationUpsertWithWhereUniqueWithoutOrganizationInput[]
        createMany?: InvitationCreateManyOrganizationInputEnvelope
        set?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        disconnect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        delete?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        connect?: InvitationWhereUniqueInput | InvitationWhereUniqueInput[]
        update?: InvitationUpdateWithWhereUniqueWithoutOrganizationInput | InvitationUpdateWithWhereUniqueWithoutOrganizationInput[]
        updateMany?: InvitationUpdateManyWithWhereWithoutOrganizationInput | InvitationUpdateManyWithWhereWithoutOrganizationInput[]
        deleteMany?: InvitationScalarWhereInput | InvitationScalarWhereInput[]
    }

    export type OrganizationCreateNestedOneWithoutMembersInput = {
        create?: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
        connectOrCreate?: OrganizationCreateOrConnectWithoutMembersInput
        connect?: OrganizationWhereUniqueInput
    }

    export type UserCreateNestedOneWithoutMembersInput = {
        create?: XOR<UserCreateWithoutMembersInput, UserUncheckedCreateWithoutMembersInput>
        connectOrCreate?: UserCreateOrConnectWithoutMembersInput
        connect?: UserWhereUniqueInput
    }

    export type OrganizationUpdateOneRequiredWithoutMembersNestedInput = {
        create?: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
        connectOrCreate?: OrganizationCreateOrConnectWithoutMembersInput
        upsert?: OrganizationUpsertWithoutMembersInput
        connect?: OrganizationWhereUniqueInput
        update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutMembersInput, OrganizationUpdateWithoutMembersInput>, OrganizationUncheckedUpdateWithoutMembersInput>
    }

    export type UserUpdateOneRequiredWithoutMembersNestedInput = {
        create?: XOR<UserCreateWithoutMembersInput, UserUncheckedCreateWithoutMembersInput>
        connectOrCreate?: UserCreateOrConnectWithoutMembersInput
        upsert?: UserUpsertWithoutMembersInput
        connect?: UserWhereUniqueInput
        update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMembersInput, UserUpdateWithoutMembersInput>, UserUncheckedUpdateWithoutMembersInput>
    }

    export type OrganizationCreateNestedOneWithoutInvitationsInput = {
        create?: XOR<OrganizationCreateWithoutInvitationsInput, OrganizationUncheckedCreateWithoutInvitationsInput>
        connectOrCreate?: OrganizationCreateOrConnectWithoutInvitationsInput
        connect?: OrganizationWhereUniqueInput
    }

    export type UserCreateNestedOneWithoutInvitationsInput = {
        create?: XOR<UserCreateWithoutInvitationsInput, UserUncheckedCreateWithoutInvitationsInput>
        connectOrCreate?: UserCreateOrConnectWithoutInvitationsInput
        connect?: UserWhereUniqueInput
    }

    export type OrganizationUpdateOneRequiredWithoutInvitationsNestedInput = {
        create?: XOR<OrganizationCreateWithoutInvitationsInput, OrganizationUncheckedCreateWithoutInvitationsInput>
        connectOrCreate?: OrganizationCreateOrConnectWithoutInvitationsInput
        upsert?: OrganizationUpsertWithoutInvitationsInput
        connect?: OrganizationWhereUniqueInput
        update?: XOR<XOR<OrganizationUpdateToOneWithWhereWithoutInvitationsInput, OrganizationUpdateWithoutInvitationsInput>, OrganizationUncheckedUpdateWithoutInvitationsInput>
    }

    export type UserUpdateOneRequiredWithoutInvitationsNestedInput = {
        create?: XOR<UserCreateWithoutInvitationsInput, UserUncheckedCreateWithoutInvitationsInput>
        connectOrCreate?: UserCreateOrConnectWithoutInvitationsInput
        upsert?: UserUpsertWithoutInvitationsInput
        connect?: UserWhereUniqueInput
        update?: XOR<XOR<UserUpdateToOneWithWhereWithoutInvitationsInput, UserUpdateWithoutInvitationsInput>, UserUncheckedUpdateWithoutInvitationsInput>
    }

    export type UserCreateNestedOneWithoutTwofactorsInput = {
        create?: XOR<UserCreateWithoutTwofactorsInput, UserUncheckedCreateWithoutTwofactorsInput>
        connectOrCreate?: UserCreateOrConnectWithoutTwofactorsInput
        connect?: UserWhereUniqueInput
    }

    export type UserUpdateOneRequiredWithoutTwofactorsNestedInput = {
        create?: XOR<UserCreateWithoutTwofactorsInput, UserUncheckedCreateWithoutTwofactorsInput>
        connectOrCreate?: UserCreateOrConnectWithoutTwofactorsInput
        upsert?: UserUpsertWithoutTwofactorsInput
        connect?: UserWhereUniqueInput
        update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTwofactorsInput, UserUpdateWithoutTwofactorsInput>, UserUncheckedUpdateWithoutTwofactorsInput>
    }

    export type UserCreateNestedOneWithoutMessagesInput = {
        create?: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
        connectOrCreate?: UserCreateOrConnectWithoutMessagesInput
        connect?: UserWhereUniqueInput
    }

    export type BytesFieldUpdateOperationsInput = {
        set?: Uint8Array
    }

    export type UserUpdateOneRequiredWithoutMessagesNestedInput = {
        create?: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
        connectOrCreate?: UserCreateOrConnectWithoutMessagesInput
        upsert?: UserUpsertWithoutMessagesInput
        connect?: UserWhereUniqueInput
        update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMessagesInput, UserUpdateWithoutMessagesInput>, UserUncheckedUpdateWithoutMessagesInput>
    }

    export type IntFieldUpdateOperationsInput = {
        set?: number
        increment?: number
        decrement?: number
        multiply?: number
        divide?: number
    }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

    export type NestedBoolNullableFilter<$PrismaModel = never> = {
        equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
        not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
    }

    export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
        equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
        in?: Date[] | string[] | null
        notIn?: Date[] | string[] | null
        lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
        not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
    }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

    export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
        equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
        not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
        _count?: NestedIntNullableFilter<$PrismaModel>
        _min?: NestedBoolNullableFilter<$PrismaModel>
        _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

    export type NestedBytesFilter<$PrismaModel = never> = {
        equals?: Uint8Array | BytesFieldRefInput<$PrismaModel>
        in?: Uint8Array[]
        notIn?: Uint8Array[]
        not?: NestedBytesFilter<$PrismaModel> | Uint8Array
    }

    export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
        equals?: number | IntFieldRefInput<$PrismaModel>
        in?: number[]
        notIn?: number[]
        lt?: number | IntFieldRefInput<$PrismaModel>
        lte?: number | IntFieldRefInput<$PrismaModel>
        gt?: number | IntFieldRefInput<$PrismaModel>
        gte?: number | IntFieldRefInput<$PrismaModel>
        not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
        _count?: NestedIntFilter<$PrismaModel>
        _avg?: NestedFloatFilter<$PrismaModel>
        _sum?: NestedIntFilter<$PrismaModel>
        _min?: NestedIntFilter<$PrismaModel>
        _max?: NestedIntFilter<$PrismaModel>
    }

    export type NestedFloatFilter<$PrismaModel = never> = {
        equals?: number | FloatFieldRefInput<$PrismaModel>
        in?: number[]
        notIn?: number[]
        lt?: number | FloatFieldRefInput<$PrismaModel>
        lte?: number | FloatFieldRefInput<$PrismaModel>
        gt?: number | FloatFieldRefInput<$PrismaModel>
        gte?: number | FloatFieldRefInput<$PrismaModel>
        not?: NestedFloatFilter<$PrismaModel> | number
    }

    export type NestedBytesWithAggregatesFilter<$PrismaModel = never> = {
        equals?: Uint8Array | BytesFieldRefInput<$PrismaModel>
        in?: Uint8Array[]
        notIn?: Uint8Array[]
        not?: NestedBytesWithAggregatesFilter<$PrismaModel> | Uint8Array
        _count?: NestedIntFilter<$PrismaModel>
        _min?: NestedBytesFilter<$PrismaModel>
        _max?: NestedBytesFilter<$PrismaModel>
    }

  export type AccountCreateWithoutUserInput = {
    id: string
    accountId: string
    providerId: string
    accessToken?: string | null
    refreshToken?: string | null
    idToken?: string | null
    accessTokenExpiresAt?: Date | string | null
    refreshTokenExpiresAt?: Date | string | null
    scope?: string | null
    password?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type AccountUncheckedCreateWithoutUserInput = {
    id: string
    accountId: string
    providerId: string
    accessToken?: string | null
    refreshToken?: string | null
    idToken?: string | null
    accessTokenExpiresAt?: Date | string | null
    refreshTokenExpiresAt?: Date | string | null
    scope?: string | null
    password?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type AccountCreateOrConnectWithoutUserInput = {
    where: AccountWhereUniqueInput
    create: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput>
  }

  export type AccountCreateManyUserInputEnvelope = {
    data: AccountCreateManyUserInput | AccountCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SessionCreateWithoutUserInput = {
    id: string
    expiresAt: Date | string
    token: string
    createdAt: Date | string
    updatedAt: Date | string
    ipAddress?: string | null
    userAgent?: string | null
      impersonatedBy?: string | null
      activeOrganizationId?: string | null
  }

  export type SessionUncheckedCreateWithoutUserInput = {
    id: string
    expiresAt: Date | string
    token: string
    createdAt: Date | string
    updatedAt: Date | string
    ipAddress?: string | null
    userAgent?: string | null
      impersonatedBy?: string | null
      activeOrganizationId?: string | null
  }

  export type SessionCreateOrConnectWithoutUserInput = {
    where: SessionWhereUniqueInput
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionCreateManyUserInputEnvelope = {
    data: SessionCreateManyUserInput | SessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

    export type MessageCreateWithoutUserInput = {
        createdAt: Date | string
        channelId: string
        content: Uint8Array
    }

    export type MessageUncheckedCreateWithoutUserInput = {
        id?: number
        createdAt: Date | string
        channelId: string
        content: Uint8Array
    }

    export type MessageCreateOrConnectWithoutUserInput = {
        where: MessageWhereUniqueInput
        create: XOR<MessageCreateWithoutUserInput, MessageUncheckedCreateWithoutUserInput>
    }

    export type MessageCreateManyUserInputEnvelope = {
        data: MessageCreateManyUserInput | MessageCreateManyUserInput[]
        skipDuplicates?: boolean
    }

    export type MemberCreateWithoutUserInput = {
        id: string
        role: string
        createdAt: Date | string
        organization: OrganizationCreateNestedOneWithoutMembersInput
    }

    export type MemberUncheckedCreateWithoutUserInput = {
        id: string
        organizationId: string
        role: string
        createdAt: Date | string
    }

    export type MemberCreateOrConnectWithoutUserInput = {
        where: MemberWhereUniqueInput
        create: XOR<MemberCreateWithoutUserInput, MemberUncheckedCreateWithoutUserInput>
    }

    export type MemberCreateManyUserInputEnvelope = {
        data: MemberCreateManyUserInput | MemberCreateManyUserInput[]
        skipDuplicates?: boolean
    }

    export type InvitationCreateWithoutUserInput = {
        id: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
        organization: OrganizationCreateNestedOneWithoutInvitationsInput
    }

    export type InvitationUncheckedCreateWithoutUserInput = {
        id: string
        organizationId: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
    }

    export type InvitationCreateOrConnectWithoutUserInput = {
        where: InvitationWhereUniqueInput
        create: XOR<InvitationCreateWithoutUserInput, InvitationUncheckedCreateWithoutUserInput>
    }

    export type InvitationCreateManyUserInputEnvelope = {
        data: InvitationCreateManyUserInput | InvitationCreateManyUserInput[]
        skipDuplicates?: boolean
    }

    export type TwoFactorCreateWithoutUserInput = {
        id: string
        secret: string
        backupCodes: string
    }

    export type TwoFactorUncheckedCreateWithoutUserInput = {
        id: string
        secret: string
        backupCodes: string
    }

    export type TwoFactorCreateOrConnectWithoutUserInput = {
        where: TwoFactorWhereUniqueInput
        create: XOR<TwoFactorCreateWithoutUserInput, TwoFactorUncheckedCreateWithoutUserInput>
    }

    export type TwoFactorCreateManyUserInputEnvelope = {
        data: TwoFactorCreateManyUserInput | TwoFactorCreateManyUserInput[]
        skipDuplicates?: boolean
    }

  export type AccountUpsertWithWhereUniqueWithoutUserInput = {
    where: AccountWhereUniqueInput
    update: XOR<AccountUpdateWithoutUserInput, AccountUncheckedUpdateWithoutUserInput>
    create: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput>
  }

  export type AccountUpdateWithWhereUniqueWithoutUserInput = {
    where: AccountWhereUniqueInput
    data: XOR<AccountUpdateWithoutUserInput, AccountUncheckedUpdateWithoutUserInput>
  }

  export type AccountUpdateManyWithWhereWithoutUserInput = {
    where: AccountScalarWhereInput
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyWithoutUserInput>
  }

  export type AccountScalarWhereInput = {
    AND?: AccountScalarWhereInput | AccountScalarWhereInput[]
    OR?: AccountScalarWhereInput[]
    NOT?: AccountScalarWhereInput | AccountScalarWhereInput[]
    id?: StringFilter<"Account"> | string
    accountId?: StringFilter<"Account"> | string
    providerId?: StringFilter<"Account"> | string
    userId?: StringFilter<"Account"> | string
    accessToken?: StringNullableFilter<"Account"> | string | null
    refreshToken?: StringNullableFilter<"Account"> | string | null
    idToken?: StringNullableFilter<"Account"> | string | null
    accessTokenExpiresAt?: DateTimeNullableFilter<"Account"> | Date | string | null
    refreshTokenExpiresAt?: DateTimeNullableFilter<"Account"> | Date | string | null
    scope?: StringNullableFilter<"Account"> | string | null
    password?: StringNullableFilter<"Account"> | string | null
    createdAt?: DateTimeFilter<"Account"> | Date | string
    updatedAt?: DateTimeFilter<"Account"> | Date | string
  }

  export type SessionUpsertWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    update: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionUpdateWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    data: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
  }

  export type SessionUpdateManyWithWhereWithoutUserInput = {
    where: SessionScalarWhereInput
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyWithoutUserInput>
  }

  export type SessionScalarWhereInput = {
    AND?: SessionScalarWhereInput | SessionScalarWhereInput[]
    OR?: SessionScalarWhereInput[]
    NOT?: SessionScalarWhereInput | SessionScalarWhereInput[]
    id?: StringFilter<"Session"> | string
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    token?: StringFilter<"Session"> | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    updatedAt?: DateTimeFilter<"Session"> | Date | string
    ipAddress?: StringNullableFilter<"Session"> | string | null
    userAgent?: StringNullableFilter<"Session"> | string | null
    userId?: StringFilter<"Session"> | string
      impersonatedBy?: StringNullableFilter<"Session"> | string | null
      activeOrganizationId?: StringNullableFilter<"Session"> | string | null
  }

    export type MessageUpsertWithWhereUniqueWithoutUserInput = {
        where: MessageWhereUniqueInput
        update: XOR<MessageUpdateWithoutUserInput, MessageUncheckedUpdateWithoutUserInput>
        create: XOR<MessageCreateWithoutUserInput, MessageUncheckedCreateWithoutUserInput>
    }

    export type MessageUpdateWithWhereUniqueWithoutUserInput = {
        where: MessageWhereUniqueInput
        data: XOR<MessageUpdateWithoutUserInput, MessageUncheckedUpdateWithoutUserInput>
    }

    export type MessageUpdateManyWithWhereWithoutUserInput = {
        where: MessageScalarWhereInput
        data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutUserInput>
    }

    export type MessageScalarWhereInput = {
        AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
        OR?: MessageScalarWhereInput[]
        NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
        id?: IntFilter<"Message"> | number
        createdAt?: DateTimeFilter<"Message"> | Date | string
        userId?: StringFilter<"Message"> | string
        channelId?: StringFilter<"Message"> | string
        content?: BytesFilter<"Message"> | Uint8Array
    }

    export type MemberUpsertWithWhereUniqueWithoutUserInput = {
        where: MemberWhereUniqueInput
        update: XOR<MemberUpdateWithoutUserInput, MemberUncheckedUpdateWithoutUserInput>
        create: XOR<MemberCreateWithoutUserInput, MemberUncheckedCreateWithoutUserInput>
    }

    export type MemberUpdateWithWhereUniqueWithoutUserInput = {
        where: MemberWhereUniqueInput
        data: XOR<MemberUpdateWithoutUserInput, MemberUncheckedUpdateWithoutUserInput>
    }

    export type MemberUpdateManyWithWhereWithoutUserInput = {
        where: MemberScalarWhereInput
        data: XOR<MemberUpdateManyMutationInput, MemberUncheckedUpdateManyWithoutUserInput>
    }

    export type MemberScalarWhereInput = {
        AND?: MemberScalarWhereInput | MemberScalarWhereInput[]
        OR?: MemberScalarWhereInput[]
        NOT?: MemberScalarWhereInput | MemberScalarWhereInput[]
        id?: StringFilter<"Member"> | string
        organizationId?: StringFilter<"Member"> | string
        userId?: StringFilter<"Member"> | string
        role?: StringFilter<"Member"> | string
        createdAt?: DateTimeFilter<"Member"> | Date | string
    }

    export type InvitationUpsertWithWhereUniqueWithoutUserInput = {
        where: InvitationWhereUniqueInput
        update: XOR<InvitationUpdateWithoutUserInput, InvitationUncheckedUpdateWithoutUserInput>
        create: XOR<InvitationCreateWithoutUserInput, InvitationUncheckedCreateWithoutUserInput>
    }

    export type InvitationUpdateWithWhereUniqueWithoutUserInput = {
        where: InvitationWhereUniqueInput
        data: XOR<InvitationUpdateWithoutUserInput, InvitationUncheckedUpdateWithoutUserInput>
    }

    export type InvitationUpdateManyWithWhereWithoutUserInput = {
        where: InvitationScalarWhereInput
        data: XOR<InvitationUpdateManyMutationInput, InvitationUncheckedUpdateManyWithoutUserInput>
    }

    export type InvitationScalarWhereInput = {
        AND?: InvitationScalarWhereInput | InvitationScalarWhereInput[]
        OR?: InvitationScalarWhereInput[]
        NOT?: InvitationScalarWhereInput | InvitationScalarWhereInput[]
        id?: StringFilter<"Invitation"> | string
        organizationId?: StringFilter<"Invitation"> | string
        email?: StringFilter<"Invitation"> | string
        role?: StringNullableFilter<"Invitation"> | string | null
        status?: StringFilter<"Invitation"> | string
        expiresAt?: DateTimeFilter<"Invitation"> | Date | string
        inviterId?: StringFilter<"Invitation"> | string
    }

    export type TwoFactorUpsertWithWhereUniqueWithoutUserInput = {
        where: TwoFactorWhereUniqueInput
        update: XOR<TwoFactorUpdateWithoutUserInput, TwoFactorUncheckedUpdateWithoutUserInput>
        create: XOR<TwoFactorCreateWithoutUserInput, TwoFactorUncheckedCreateWithoutUserInput>
    }

    export type TwoFactorUpdateWithWhereUniqueWithoutUserInput = {
        where: TwoFactorWhereUniqueInput
        data: XOR<TwoFactorUpdateWithoutUserInput, TwoFactorUncheckedUpdateWithoutUserInput>
    }

    export type TwoFactorUpdateManyWithWhereWithoutUserInput = {
        where: TwoFactorScalarWhereInput
        data: XOR<TwoFactorUpdateManyMutationInput, TwoFactorUncheckedUpdateManyWithoutUserInput>
    }

    export type TwoFactorScalarWhereInput = {
        AND?: TwoFactorScalarWhereInput | TwoFactorScalarWhereInput[]
        OR?: TwoFactorScalarWhereInput[]
        NOT?: TwoFactorScalarWhereInput | TwoFactorScalarWhereInput[]
        id?: StringFilter<"TwoFactor"> | string
        secret?: StringFilter<"TwoFactor"> | string
        backupCodes?: StringFilter<"TwoFactor"> | string
        userId?: StringFilter<"TwoFactor"> | string
  }

  export type UserCreateWithoutSessionsInput = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date | string
    updatedAt: Date | string
      role?: string | null
      banned?: boolean | null
      banReason?: string | null
      banExpires?: Date | string | null
      twoFactorEnabled?: boolean | null
    accounts?: AccountCreateNestedManyWithoutUserInput
      messages?: MessageCreateNestedManyWithoutUserInput
      members?: MemberCreateNestedManyWithoutUserInput
      invitations?: InvitationCreateNestedManyWithoutUserInput
      twofactors?: TwoFactorCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date | string
    updatedAt: Date | string
      role?: string | null
      banned?: boolean | null
      banReason?: string | null
      banExpires?: Date | string | null
      twoFactorEnabled?: boolean | null
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
      messages?: MessageUncheckedCreateNestedManyWithoutUserInput
      members?: MemberUncheckedCreateNestedManyWithoutUserInput
      invitations?: InvitationUncheckedCreateNestedManyWithoutUserInput
      twofactors?: TwoFactorUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    accounts?: AccountUpdateManyWithoutUserNestedInput
      messages?: MessageUpdateManyWithoutUserNestedInput
      members?: MemberUpdateManyWithoutUserNestedInput
      invitations?: InvitationUpdateManyWithoutUserNestedInput
      twofactors?: TwoFactorUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
      messages?: MessageUncheckedUpdateManyWithoutUserNestedInput
      members?: MemberUncheckedUpdateManyWithoutUserNestedInput
      invitations?: InvitationUncheckedUpdateManyWithoutUserNestedInput
      twofactors?: TwoFactorUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutAccountsInput = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date | string
    updatedAt: Date | string
      role?: string | null
      banned?: boolean | null
      banReason?: string | null
      banExpires?: Date | string | null
      twoFactorEnabled?: boolean | null
    sessions?: SessionCreateNestedManyWithoutUserInput
      messages?: MessageCreateNestedManyWithoutUserInput
      members?: MemberCreateNestedManyWithoutUserInput
      invitations?: InvitationCreateNestedManyWithoutUserInput
      twofactors?: TwoFactorCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutAccountsInput = {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date | string
    updatedAt: Date | string
      role?: string | null
      banned?: boolean | null
      banReason?: string | null
      banExpires?: Date | string | null
      twoFactorEnabled?: boolean | null
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
      messages?: MessageUncheckedCreateNestedManyWithoutUserInput
      members?: MemberUncheckedCreateNestedManyWithoutUserInput
      invitations?: InvitationUncheckedCreateNestedManyWithoutUserInput
      twofactors?: TwoFactorUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutAccountsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
  }

  export type UserUpsertWithoutAccountsInput = {
    update: XOR<UserUpdateWithoutAccountsInput, UserUncheckedUpdateWithoutAccountsInput>
    create: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAccountsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAccountsInput, UserUncheckedUpdateWithoutAccountsInput>
  }

  export type UserUpdateWithoutAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    sessions?: SessionUpdateManyWithoutUserNestedInput
      messages?: MessageUpdateManyWithoutUserNestedInput
      members?: MemberUpdateManyWithoutUserNestedInput
      invitations?: InvitationUpdateManyWithoutUserNestedInput
      twofactors?: TwoFactorUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
      role?: NullableStringFieldUpdateOperationsInput | string | null
      banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
      banReason?: NullableStringFieldUpdateOperationsInput | string | null
      banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
      twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
      messages?: MessageUncheckedUpdateManyWithoutUserNestedInput
      members?: MemberUncheckedUpdateManyWithoutUserNestedInput
      invitations?: InvitationUncheckedUpdateManyWithoutUserNestedInput
      twofactors?: TwoFactorUncheckedUpdateManyWithoutUserNestedInput
  }

    export type MemberCreateWithoutOrganizationInput = {
        id: string
        role: string
        createdAt: Date | string
        user: UserCreateNestedOneWithoutMembersInput
    }

    export type MemberUncheckedCreateWithoutOrganizationInput = {
        id: string
        userId: string
        role: string
        createdAt: Date | string
    }

    export type MemberCreateOrConnectWithoutOrganizationInput = {
        where: MemberWhereUniqueInput
        create: XOR<MemberCreateWithoutOrganizationInput, MemberUncheckedCreateWithoutOrganizationInput>
    }

    export type MemberCreateManyOrganizationInputEnvelope = {
        data: MemberCreateManyOrganizationInput | MemberCreateManyOrganizationInput[]
        skipDuplicates?: boolean
    }

    export type InvitationCreateWithoutOrganizationInput = {
        id: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
        user: UserCreateNestedOneWithoutInvitationsInput
    }

    export type InvitationUncheckedCreateWithoutOrganizationInput = {
        id: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
        inviterId: string
    }

    export type InvitationCreateOrConnectWithoutOrganizationInput = {
        where: InvitationWhereUniqueInput
        create: XOR<InvitationCreateWithoutOrganizationInput, InvitationUncheckedCreateWithoutOrganizationInput>
    }

    export type InvitationCreateManyOrganizationInputEnvelope = {
        data: InvitationCreateManyOrganizationInput | InvitationCreateManyOrganizationInput[]
        skipDuplicates?: boolean
    }

    export type MemberUpsertWithWhereUniqueWithoutOrganizationInput = {
        where: MemberWhereUniqueInput
        update: XOR<MemberUpdateWithoutOrganizationInput, MemberUncheckedUpdateWithoutOrganizationInput>
        create: XOR<MemberCreateWithoutOrganizationInput, MemberUncheckedCreateWithoutOrganizationInput>
    }

    export type MemberUpdateWithWhereUniqueWithoutOrganizationInput = {
        where: MemberWhereUniqueInput
        data: XOR<MemberUpdateWithoutOrganizationInput, MemberUncheckedUpdateWithoutOrganizationInput>
    }

    export type MemberUpdateManyWithWhereWithoutOrganizationInput = {
        where: MemberScalarWhereInput
        data: XOR<MemberUpdateManyMutationInput, MemberUncheckedUpdateManyWithoutOrganizationInput>
    }

    export type InvitationUpsertWithWhereUniqueWithoutOrganizationInput = {
        where: InvitationWhereUniqueInput
        update: XOR<InvitationUpdateWithoutOrganizationInput, InvitationUncheckedUpdateWithoutOrganizationInput>
        create: XOR<InvitationCreateWithoutOrganizationInput, InvitationUncheckedCreateWithoutOrganizationInput>
    }

    export type InvitationUpdateWithWhereUniqueWithoutOrganizationInput = {
        where: InvitationWhereUniqueInput
        data: XOR<InvitationUpdateWithoutOrganizationInput, InvitationUncheckedUpdateWithoutOrganizationInput>
    }

    export type InvitationUpdateManyWithWhereWithoutOrganizationInput = {
        where: InvitationScalarWhereInput
        data: XOR<InvitationUpdateManyMutationInput, InvitationUncheckedUpdateManyWithoutOrganizationInput>
    }

    export type OrganizationCreateWithoutMembersInput = {
        id: string
        name: string
        slug?: string | null
        logo?: string | null
        createdAt: Date | string
        metadata?: string | null
        invitations?: InvitationCreateNestedManyWithoutOrganizationInput
    }

    export type OrganizationUncheckedCreateWithoutMembersInput = {
        id: string
        name: string
        slug?: string | null
        logo?: string | null
        createdAt: Date | string
        metadata?: string | null
        invitations?: InvitationUncheckedCreateNestedManyWithoutOrganizationInput
    }

    export type OrganizationCreateOrConnectWithoutMembersInput = {
        where: OrganizationWhereUniqueInput
        create: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
    }

    export type UserCreateWithoutMembersInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountCreateNestedManyWithoutUserInput
        sessions?: SessionCreateNestedManyWithoutUserInput
        messages?: MessageCreateNestedManyWithoutUserInput
        invitations?: InvitationCreateNestedManyWithoutUserInput
        twofactors?: TwoFactorCreateNestedManyWithoutUserInput
    }

    export type UserUncheckedCreateWithoutMembersInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
        sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
        messages?: MessageUncheckedCreateNestedManyWithoutUserInput
        invitations?: InvitationUncheckedCreateNestedManyWithoutUserInput
        twofactors?: TwoFactorUncheckedCreateNestedManyWithoutUserInput
    }

    export type UserCreateOrConnectWithoutMembersInput = {
        where: UserWhereUniqueInput
        create: XOR<UserCreateWithoutMembersInput, UserUncheckedCreateWithoutMembersInput>
    }

    export type OrganizationUpsertWithoutMembersInput = {
        update: XOR<OrganizationUpdateWithoutMembersInput, OrganizationUncheckedUpdateWithoutMembersInput>
        create: XOR<OrganizationCreateWithoutMembersInput, OrganizationUncheckedCreateWithoutMembersInput>
        where?: OrganizationWhereInput
    }

    export type OrganizationUpdateToOneWithWhereWithoutMembersInput = {
        where?: OrganizationWhereInput
        data: XOR<OrganizationUpdateWithoutMembersInput, OrganizationUncheckedUpdateWithoutMembersInput>
    }

    export type OrganizationUpdateWithoutMembersInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
        invitations?: InvitationUpdateManyWithoutOrganizationNestedInput
    }

    export type OrganizationUncheckedUpdateWithoutMembersInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
        invitations?: InvitationUncheckedUpdateManyWithoutOrganizationNestedInput
    }

    export type UserUpsertWithoutMembersInput = {
        update: XOR<UserUpdateWithoutMembersInput, UserUncheckedUpdateWithoutMembersInput>
        create: XOR<UserCreateWithoutMembersInput, UserUncheckedCreateWithoutMembersInput>
        where?: UserWhereInput
    }

    export type UserUpdateToOneWithWhereWithoutMembersInput = {
        where?: UserWhereInput
        data: XOR<UserUpdateWithoutMembersInput, UserUncheckedUpdateWithoutMembersInput>
    }

    export type UserUpdateWithoutMembersInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUpdateManyWithoutUserNestedInput
        sessions?: SessionUpdateManyWithoutUserNestedInput
        messages?: MessageUpdateManyWithoutUserNestedInput
        invitations?: InvitationUpdateManyWithoutUserNestedInput
        twofactors?: TwoFactorUpdateManyWithoutUserNestedInput
    }

    export type UserUncheckedUpdateWithoutMembersInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
        sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
        messages?: MessageUncheckedUpdateManyWithoutUserNestedInput
        invitations?: InvitationUncheckedUpdateManyWithoutUserNestedInput
        twofactors?: TwoFactorUncheckedUpdateManyWithoutUserNestedInput
    }

    export type OrganizationCreateWithoutInvitationsInput = {
        id: string
        name: string
        slug?: string | null
        logo?: string | null
        createdAt: Date | string
        metadata?: string | null
        members?: MemberCreateNestedManyWithoutOrganizationInput
    }

    export type OrganizationUncheckedCreateWithoutInvitationsInput = {
        id: string
        name: string
        slug?: string | null
        logo?: string | null
        createdAt: Date | string
        metadata?: string | null
        members?: MemberUncheckedCreateNestedManyWithoutOrganizationInput
    }

    export type OrganizationCreateOrConnectWithoutInvitationsInput = {
        where: OrganizationWhereUniqueInput
        create: XOR<OrganizationCreateWithoutInvitationsInput, OrganizationUncheckedCreateWithoutInvitationsInput>
    }

    export type UserCreateWithoutInvitationsInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountCreateNestedManyWithoutUserInput
        sessions?: SessionCreateNestedManyWithoutUserInput
        messages?: MessageCreateNestedManyWithoutUserInput
        members?: MemberCreateNestedManyWithoutUserInput
        twofactors?: TwoFactorCreateNestedManyWithoutUserInput
    }

    export type UserUncheckedCreateWithoutInvitationsInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
        sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
        messages?: MessageUncheckedCreateNestedManyWithoutUserInput
        members?: MemberUncheckedCreateNestedManyWithoutUserInput
        twofactors?: TwoFactorUncheckedCreateNestedManyWithoutUserInput
    }

    export type UserCreateOrConnectWithoutInvitationsInput = {
        where: UserWhereUniqueInput
        create: XOR<UserCreateWithoutInvitationsInput, UserUncheckedCreateWithoutInvitationsInput>
    }

    export type OrganizationUpsertWithoutInvitationsInput = {
        update: XOR<OrganizationUpdateWithoutInvitationsInput, OrganizationUncheckedUpdateWithoutInvitationsInput>
        create: XOR<OrganizationCreateWithoutInvitationsInput, OrganizationUncheckedCreateWithoutInvitationsInput>
        where?: OrganizationWhereInput
    }

    export type OrganizationUpdateToOneWithWhereWithoutInvitationsInput = {
        where?: OrganizationWhereInput
        data: XOR<OrganizationUpdateWithoutInvitationsInput, OrganizationUncheckedUpdateWithoutInvitationsInput>
    }

    export type OrganizationUpdateWithoutInvitationsInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
        members?: MemberUpdateManyWithoutOrganizationNestedInput
    }

    export type OrganizationUncheckedUpdateWithoutInvitationsInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        slug?: NullableStringFieldUpdateOperationsInput | string | null
        logo?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        metadata?: NullableStringFieldUpdateOperationsInput | string | null
        members?: MemberUncheckedUpdateManyWithoutOrganizationNestedInput
    }

    export type UserUpsertWithoutInvitationsInput = {
        update: XOR<UserUpdateWithoutInvitationsInput, UserUncheckedUpdateWithoutInvitationsInput>
        create: XOR<UserCreateWithoutInvitationsInput, UserUncheckedCreateWithoutInvitationsInput>
        where?: UserWhereInput
    }

    export type UserUpdateToOneWithWhereWithoutInvitationsInput = {
        where?: UserWhereInput
        data: XOR<UserUpdateWithoutInvitationsInput, UserUncheckedUpdateWithoutInvitationsInput>
    }

    export type UserUpdateWithoutInvitationsInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUpdateManyWithoutUserNestedInput
        sessions?: SessionUpdateManyWithoutUserNestedInput
        messages?: MessageUpdateManyWithoutUserNestedInput
        members?: MemberUpdateManyWithoutUserNestedInput
        twofactors?: TwoFactorUpdateManyWithoutUserNestedInput
    }

    export type UserUncheckedUpdateWithoutInvitationsInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
        sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
        messages?: MessageUncheckedUpdateManyWithoutUserNestedInput
        members?: MemberUncheckedUpdateManyWithoutUserNestedInput
        twofactors?: TwoFactorUncheckedUpdateManyWithoutUserNestedInput
    }

    export type UserCreateWithoutTwofactorsInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountCreateNestedManyWithoutUserInput
        sessions?: SessionCreateNestedManyWithoutUserInput
        messages?: MessageCreateNestedManyWithoutUserInput
        members?: MemberCreateNestedManyWithoutUserInput
        invitations?: InvitationCreateNestedManyWithoutUserInput
    }

    export type UserUncheckedCreateWithoutTwofactorsInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
        sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
        messages?: MessageUncheckedCreateNestedManyWithoutUserInput
        members?: MemberUncheckedCreateNestedManyWithoutUserInput
        invitations?: InvitationUncheckedCreateNestedManyWithoutUserInput
    }

    export type UserCreateOrConnectWithoutTwofactorsInput = {
        where: UserWhereUniqueInput
        create: XOR<UserCreateWithoutTwofactorsInput, UserUncheckedCreateWithoutTwofactorsInput>
    }

    export type UserUpsertWithoutTwofactorsInput = {
        update: XOR<UserUpdateWithoutTwofactorsInput, UserUncheckedUpdateWithoutTwofactorsInput>
        create: XOR<UserCreateWithoutTwofactorsInput, UserUncheckedCreateWithoutTwofactorsInput>
        where?: UserWhereInput
    }

    export type UserUpdateToOneWithWhereWithoutTwofactorsInput = {
        where?: UserWhereInput
        data: XOR<UserUpdateWithoutTwofactorsInput, UserUncheckedUpdateWithoutTwofactorsInput>
    }

    export type UserUpdateWithoutTwofactorsInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUpdateManyWithoutUserNestedInput
        sessions?: SessionUpdateManyWithoutUserNestedInput
        messages?: MessageUpdateManyWithoutUserNestedInput
        members?: MemberUpdateManyWithoutUserNestedInput
        invitations?: InvitationUpdateManyWithoutUserNestedInput
    }

    export type UserUncheckedUpdateWithoutTwofactorsInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
        sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
        messages?: MessageUncheckedUpdateManyWithoutUserNestedInput
        members?: MemberUncheckedUpdateManyWithoutUserNestedInput
        invitations?: InvitationUncheckedUpdateManyWithoutUserNestedInput
  }

    export type UserCreateWithoutMessagesInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountCreateNestedManyWithoutUserInput
        sessions?: SessionCreateNestedManyWithoutUserInput
        members?: MemberCreateNestedManyWithoutUserInput
        invitations?: InvitationCreateNestedManyWithoutUserInput
        twofactors?: TwoFactorCreateNestedManyWithoutUserInput
    }

    export type UserUncheckedCreateWithoutMessagesInput = {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string | null
        createdAt: Date | string
        updatedAt: Date | string
        role?: string | null
        banned?: boolean | null
        banReason?: string | null
        banExpires?: Date | string | null
        twoFactorEnabled?: boolean | null
        accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
        sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
        members?: MemberUncheckedCreateNestedManyWithoutUserInput
        invitations?: InvitationUncheckedCreateNestedManyWithoutUserInput
        twofactors?: TwoFactorUncheckedCreateNestedManyWithoutUserInput
    }

    export type UserCreateOrConnectWithoutMessagesInput = {
        where: UserWhereUniqueInput
        create: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
    }

    export type UserUpsertWithoutMessagesInput = {
        update: XOR<UserUpdateWithoutMessagesInput, UserUncheckedUpdateWithoutMessagesInput>
        create: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
        where?: UserWhereInput
    }

    export type UserUpdateToOneWithWhereWithoutMessagesInput = {
        where?: UserWhereInput
        data: XOR<UserUpdateWithoutMessagesInput, UserUncheckedUpdateWithoutMessagesInput>
    }

    export type UserUpdateWithoutMessagesInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUpdateManyWithoutUserNestedInput
        sessions?: SessionUpdateManyWithoutUserNestedInput
        members?: MemberUpdateManyWithoutUserNestedInput
        invitations?: InvitationUpdateManyWithoutUserNestedInput
        twofactors?: TwoFactorUpdateManyWithoutUserNestedInput
    }

    export type UserUncheckedUpdateWithoutMessagesInput = {
        id?: StringFieldUpdateOperationsInput | string
        name?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        emailVerified?: BoolFieldUpdateOperationsInput | boolean
        image?: NullableStringFieldUpdateOperationsInput | string | null
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        banned?: NullableBoolFieldUpdateOperationsInput | boolean | null
        banReason?: NullableStringFieldUpdateOperationsInput | string | null
        banExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
        twoFactorEnabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
        accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
        sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
        members?: MemberUncheckedUpdateManyWithoutUserNestedInput
        invitations?: InvitationUncheckedUpdateManyWithoutUserNestedInput
        twofactors?: TwoFactorUncheckedUpdateManyWithoutUserNestedInput
    }

  export type AccountCreateManyUserInput = {
    id: string
    accountId: string
    providerId: string
    accessToken?: string | null
    refreshToken?: string | null
    idToken?: string | null
    accessTokenExpiresAt?: Date | string | null
    refreshTokenExpiresAt?: Date | string | null
    scope?: string | null
    password?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type SessionCreateManyUserInput = {
    id: string
    expiresAt: Date | string
    token: string
    createdAt: Date | string
    updatedAt: Date | string
    ipAddress?: string | null
    userAgent?: string | null
      impersonatedBy?: string | null
      activeOrganizationId?: string | null
  }

    export type MessageCreateManyUserInput = {
        id?: number
        createdAt: Date | string
        channelId: string
        content: Uint8Array
    }

    export type MemberCreateManyUserInput = {
        id: string
        organizationId: string
        role: string
        createdAt: Date | string
    }

    export type InvitationCreateManyUserInput = {
        id: string
        organizationId: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
    }

    export type TwoFactorCreateManyUserInput = {
        id: string
        secret: string
        backupCodes: string
  }

  export type AccountUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountId?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    idToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refreshTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountId?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    idToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refreshTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountId?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    idToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    refreshTokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
      impersonatedBy?: NullableStringFieldUpdateOperationsInput | string | null
      activeOrganizationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
      impersonatedBy?: NullableStringFieldUpdateOperationsInput | string | null
      activeOrganizationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
      impersonatedBy?: NullableStringFieldUpdateOperationsInput | string | null
      activeOrganizationId?: NullableStringFieldUpdateOperationsInput | string | null
  }

    export type MessageUpdateWithoutUserInput = {
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        channelId?: StringFieldUpdateOperationsInput | string
        content?: BytesFieldUpdateOperationsInput | Uint8Array
    }

    export type MessageUncheckedUpdateWithoutUserInput = {
        id?: IntFieldUpdateOperationsInput | number
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        channelId?: StringFieldUpdateOperationsInput | string
        content?: BytesFieldUpdateOperationsInput | Uint8Array
    }

    export type MessageUncheckedUpdateManyWithoutUserInput = {
        id?: IntFieldUpdateOperationsInput | number
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        channelId?: StringFieldUpdateOperationsInput | string
        content?: BytesFieldUpdateOperationsInput | Uint8Array
    }

    export type MemberUpdateWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        organization?: OrganizationUpdateOneRequiredWithoutMembersNestedInput
    }

    export type MemberUncheckedUpdateWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type MemberUncheckedUpdateManyWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type InvitationUpdateWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
        organization?: OrganizationUpdateOneRequiredWithoutInvitationsNestedInput
    }

    export type InvitationUncheckedUpdateWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type InvitationUncheckedUpdateManyWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        organizationId?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type TwoFactorUpdateWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        secret?: StringFieldUpdateOperationsInput | string
        backupCodes?: StringFieldUpdateOperationsInput | string
    }

    export type TwoFactorUncheckedUpdateWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        secret?: StringFieldUpdateOperationsInput | string
        backupCodes?: StringFieldUpdateOperationsInput | string
    }

    export type TwoFactorUncheckedUpdateManyWithoutUserInput = {
        id?: StringFieldUpdateOperationsInput | string
        secret?: StringFieldUpdateOperationsInput | string
        backupCodes?: StringFieldUpdateOperationsInput | string
    }

    export type MemberCreateManyOrganizationInput = {
        id: string
        userId: string
        role: string
        createdAt: Date | string
    }

    export type InvitationCreateManyOrganizationInput = {
        id: string
        email: string
        role?: string | null
        status: string
        expiresAt: Date | string
        inviterId: string
    }

    export type MemberUpdateWithoutOrganizationInput = {
        id?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
        user?: UserUpdateOneRequiredWithoutMembersNestedInput
    }

    export type MemberUncheckedUpdateWithoutOrganizationInput = {
        id?: StringFieldUpdateOperationsInput | string
        userId?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type MemberUncheckedUpdateManyWithoutOrganizationInput = {
        id?: StringFieldUpdateOperationsInput | string
        userId?: StringFieldUpdateOperationsInput | string
        role?: StringFieldUpdateOperationsInput | string
        createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    }

    export type InvitationUpdateWithoutOrganizationInput = {
        id?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
        user?: UserUpdateOneRequiredWithoutInvitationsNestedInput
    }

    export type InvitationUncheckedUpdateWithoutOrganizationInput = {
        id?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
        inviterId?: StringFieldUpdateOperationsInput | string
    }

    export type InvitationUncheckedUpdateManyWithoutOrganizationInput = {
        id?: StringFieldUpdateOperationsInput | string
        email?: StringFieldUpdateOperationsInput | string
        role?: NullableStringFieldUpdateOperationsInput | string | null
        status?: StringFieldUpdateOperationsInput | string
        expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
        inviterId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
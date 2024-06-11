/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * Arguments used to create {@link RampProtocol}
 * @category Accounts
 * @category generated
 */
export type RampProtocolArgs = {
  index: beet.bignum
  defaultStakePool: web3.PublicKey
  defaultCurrency: web3.PublicKey
  admin: web3.PublicKey
}

export const rampProtocolDiscriminator = [62, 209, 225, 250, 195, 199, 241, 221]
/**
 * Holds the data for the {@link RampProtocol} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class RampProtocol implements RampProtocolArgs {
  private constructor(
    readonly index: beet.bignum,
    readonly defaultStakePool: web3.PublicKey,
    readonly defaultCurrency: web3.PublicKey,
    readonly admin: web3.PublicKey
  ) {}

  /**
   * Creates a {@link RampProtocol} instance from the provided args.
   */
  static fromArgs(args: RampProtocolArgs) {
    return new RampProtocol(
      args.index,
      args.defaultStakePool,
      args.defaultCurrency,
      args.admin
    )
  }

  /**
   * Deserializes the {@link RampProtocol} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [RampProtocol, number] {
    return RampProtocol.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link RampProtocol} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<RampProtocol> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find RampProtocol account at ${address}`)
    }
    return RampProtocol.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'EXSphcPS7fXSnmVPqo8Q5Hax5yRnc3t4MFWD1NozvMro'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, rampProtocolBeet)
  }

  /**
   * Deserializes the {@link RampProtocol} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [RampProtocol, number] {
    return rampProtocolBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link RampProtocol} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return rampProtocolBeet.serialize({
      accountDiscriminator: rampProtocolDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link RampProtocol}
   */
  static get byteSize() {
    return rampProtocolBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link RampProtocol} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      RampProtocol.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link RampProtocol} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === RampProtocol.byteSize
  }

  /**
   * Returns a readable version of {@link RampProtocol} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      index: (() => {
        const x = <{ toNumber: () => number }>this.index
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      defaultStakePool: this.defaultStakePool.toBase58(),
      defaultCurrency: this.defaultCurrency.toBase58(),
      admin: this.admin.toBase58(),
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const rampProtocolBeet = new beet.BeetStruct<
  RampProtocol,
  RampProtocolArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['index', beet.u64],
    ['defaultStakePool', beetSolana.publicKey],
    ['defaultCurrency', beetSolana.publicKey],
    ['admin', beetSolana.publicKey],
  ],
  RampProtocol.fromArgs,
  'RampProtocol'
)

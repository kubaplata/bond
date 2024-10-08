/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category CreatePersonalLst
 * @category generated
 */
export type CreatePersonalLstInstructionArgs = {
  lstName: string
  lstSymbol: string
  lstMetadata: string
}
/**
 * @category Instructions
 * @category CreatePersonalLst
 * @category generated
 */
export const createPersonalLstStruct = new beet.FixableBeetArgsStruct<
  CreatePersonalLstInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['lstName', beet.utf8String],
    ['lstSymbol', beet.utf8String],
    ['lstMetadata', beet.utf8String],
  ],
  'CreatePersonalLstInstructionArgs'
)
/**
 * Accounts required by the _createPersonalLst_ instruction
 *
 * @property [_writable_, **signer**] user
 * @property [_writable_] stakePoolProgram
 * @property [] stakeProgram
 * @property [_writable_] stakePool
 * @property [_writable_] withdrawAuthority
 * @property [_writable_] validatorList
 * @property [_writable_] stakeReserve
 * @property [_writable_] personalLstMint
 * @property [_writable_] managerPoolAccount
 * @property [_writable_] rampUserAccount
 * @property [_writable_] personalMarket
 * @property [_writable_] personalLstMetadata
 * @property [] metaplexProgram
 * @category Instructions
 * @category CreatePersonalLst
 * @category generated
 */
export type CreatePersonalLstInstructionAccounts = {
  user: web3.PublicKey
  stakePoolProgram: web3.PublicKey
  stakeProgram: web3.PublicKey
  stakePool: web3.PublicKey
  withdrawAuthority: web3.PublicKey
  validatorList: web3.PublicKey
  stakeReserve: web3.PublicKey
  personalLstMint: web3.PublicKey
  managerPoolAccount: web3.PublicKey
  rampUserAccount: web3.PublicKey
  personalMarket: web3.PublicKey
  personalLstMetadata: web3.PublicKey
  tokenProgram?: web3.PublicKey
  systemProgram?: web3.PublicKey
  rent?: web3.PublicKey
  metaplexProgram: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const createPersonalLstInstructionDiscriminator = [
  241, 115, 13, 240, 50, 127, 113, 211,
]

/**
 * Creates a _CreatePersonalLst_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CreatePersonalLst
 * @category generated
 */
export function createCreatePersonalLstInstruction(
  accounts: CreatePersonalLstInstructionAccounts,
  args: CreatePersonalLstInstructionArgs,
  programId = new web3.PublicKey('EXSphcPS7fXSnmVPqo8Q5Hax5yRnc3t4MFWD1NozvMro')
) {
  const [data] = createPersonalLstStruct.serialize({
    instructionDiscriminator: createPersonalLstInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.user,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.stakePoolProgram,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.stakeProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.stakePool,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.withdrawAuthority,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.validatorList,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.stakeReserve,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.personalLstMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.managerPoolAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.rampUserAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.personalMarket,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.personalLstMetadata,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.rent ?? web3.SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.metaplexProgram,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}

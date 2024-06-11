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
 * @category InitializeStakePool
 * @category generated
 */
export const initializeStakePoolStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'InitializeStakePoolInstructionArgs'
)
/**
 * Accounts required by the _initializeStakePool_ instruction
 *
 * @property [_writable_, **signer**] admin
 * @property [_writable_] stakePoolProgram
 * @property [] stakeProgram
 * @property [_writable_] stakePool
 * @property [_writable_] withdrawAuthority
 * @property [_writable_] validatorList
 * @property [_writable_] stakeReserve
 * @property [_writable_] personalLstMint
 * @property [_writable_] managerPoolAccount
 * @property [_writable_] personalLstMetadata
 * @property [] metaplexProgram
 * @category Instructions
 * @category InitializeStakePool
 * @category generated
 */
export type InitializeStakePoolInstructionAccounts = {
  admin: web3.PublicKey
  stakePoolProgram: web3.PublicKey
  stakeProgram: web3.PublicKey
  stakePool: web3.PublicKey
  withdrawAuthority: web3.PublicKey
  validatorList: web3.PublicKey
  stakeReserve: web3.PublicKey
  personalLstMint: web3.PublicKey
  managerPoolAccount: web3.PublicKey
  personalLstMetadata: web3.PublicKey
  tokenProgram?: web3.PublicKey
  systemProgram?: web3.PublicKey
  rent?: web3.PublicKey
  metaplexProgram: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initializeStakePoolInstructionDiscriminator = [
  48, 189, 243, 73, 19, 67, 36, 83,
]

/**
 * Creates a _InitializeStakePool_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category InitializeStakePool
 * @category generated
 */
export function createInitializeStakePoolInstruction(
  accounts: InitializeStakePoolInstructionAccounts,
  programId = new web3.PublicKey('EXSphcPS7fXSnmVPqo8Q5Hax5yRnc3t4MFWD1NozvMro')
) {
  const [data] = initializeStakePoolStruct.serialize({
    instructionDiscriminator: initializeStakePoolInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.admin,
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

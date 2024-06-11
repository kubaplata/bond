import * as anchor from "@coral-xyz/anchor";
import {AnchorProvider, Program} from "@coral-xyz/anchor";
import { Ramp } from "../target/types/ramp";
import {
    Connection,
    Keypair, LAMPORTS_PER_SOL,
    PublicKey,
    StakeProgram,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction
} from "@solana/web3.js";
import {BondingCurveMode, PersonalMarket, RampAccount, RampProtocol} from "../sdk";
import {expect} from "chai";
import {
    AuthorityType,
    createAssociatedTokenAccountIdempotentInstruction,
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    createSetAuthorityInstruction,
    getAssociatedTokenAddressSync,
    MINT_SIZE,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {Metaplex} from "@metaplex-foundation/js";
import {
    AccountType,
    getStakePoolAccount,
    // @ts-ignore
    getValidatorListAccount,
    stakePoolInfo,
} from "@solana/spl-stake-pool";

console.log({getValidatorListAccount});

async function createToken(
    connection: Connection,
    payer: AnchorProvider
) {
    const keypair = Keypair.generate();

    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    const createAccountIx = SystemProgram.createAccount({
        newAccountPubkey: keypair.publicKey,
        fromPubkey: payer.publicKey,
        lamports,
        programId: TOKEN_PROGRAM_ID,
        space: MINT_SIZE
    });

    const ix = createInitializeMintInstruction(
        keypair.publicKey,
        9,
        payer.publicKey,
        payer.publicKey
    );

    const tx = new Transaction();
    tx.add(createAccountIx, ix);

    const {
        lastValidBlockHeight,
        blockhash
    } = await connection.getLatestBlockhash();

    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;

    tx.partialSign(keypair);
    const signed = await payer.wallet.signTransaction(tx);

    const sent = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: sent
    }, "confirmed");

    return keypair.publicKey;
}

async function transferAuthority(
    mint: PublicKey,
    currentAuthority: AnchorProvider,
    type: AuthorityType,
    newAuthority: PublicKey | null
) {
    const ix = createSetAuthorityInstruction(
        mint,
        currentAuthority.publicKey,
        type,
        newAuthority
    );

    const tx = new Transaction();
    tx.add(ix);

    const {
        lastValidBlockHeight,
        blockhash
    } = await currentAuthority.connection.getLatestBlockhash();

    tx.feePayer = currentAuthority.publicKey;
    tx.recentBlockhash = blockhash;

    const signed = await currentAuthority.wallet.signTransaction(tx);

    const sent = await currentAuthority.connection.sendRawTransaction(signed.serialize());
    await currentAuthority.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: sent
    }, "confirmed");
}

async function mintTokens(
    mint: PublicKey,
    payer: AnchorProvider,
    amount: number
) {

    const ata = getAssociatedTokenAddressSync(
        mint,
        payer.publicKey
    );

    const ataIx = createAssociatedTokenAccountIdempotentInstruction(
        payer.publicKey,
        ata,
        payer.publicKey,
        mint,
    );

    const ix = createMintToInstruction(
        mint,
        ata,
        payer.publicKey,
        amount,
    );

    const tx = new Transaction();
    tx.add(ataIx, ix);

    const {
        lastValidBlockHeight,
        blockhash
    } = await payer.connection.getLatestBlockhash();

    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;

    const signed = await payer.wallet.signTransaction(tx);

    const sent = await payer.connection.sendRawTransaction(signed.serialize());
    await payer.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: sent
    }, "confirmed");
}

async function initializeAta(
    token: PublicKey,
    owner: PublicKey,
    provider: AnchorProvider
) {
    const ata = getAssociatedTokenAddressSync(
        token,
        owner,
        true
    );

    const ataIx = createAssociatedTokenAccountIdempotentInstruction(
        provider.publicKey,
        ata,
        owner,
        token
    );

    const tx = new Transaction();
    tx.add(ataIx);

    const {
        lastValidBlockHeight,
        blockhash
    } = await provider.connection.getLatestBlockhash();

    tx.feePayer = provider.publicKey;
    tx.recentBlockhash = blockhash;

    const signed = await provider.wallet.signTransaction(tx);

    const sent = await provider.connection.sendRawTransaction(signed.serialize());
    await provider.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: sent
    }, "confirmed");
}

describe("ramp", () => {
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const program = anchor.workspace.Ramp as Program<Ramp>;

    const metaplex = new Metaplex(provider.connection);

    let rampProtocol: PublicKey;
    let stakePoolProgram = new PublicKey("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

    before(() => {
        const [ramp] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("ramp")
            ],
            program.programId
        );

        rampProtocol = ramp;
    });

    it('Initializes Ramp LST and Ramp protocol.', async () => {
        const personalLstMint = await createToken(
            provider.connection,
            provider
        );

        const [stakePool] = PublicKey.findProgramAddressSync(
            [
                provider.wallet.publicKey.toBuffer(),
                Buffer.from("ramp_stake_pool")
            ],
            program.programId
        );

        const [withdrawAuthority] = PublicKey.findProgramAddressSync(
            [
                stakePool.toBuffer(),
                Buffer.from("withdraw")
            ],
            stakePoolProgram
        );

        console.log({ withdrawAuthority: withdrawAuthority.toString() });

        await transferAuthority(
            personalLstMint,
            provider,
            AuthorityType.MintTokens,
            withdrawAuthority
        );

        await transferAuthority(
            personalLstMint,
            provider,
            AuthorityType.FreezeAccount,
            null
        );

        const managerPoolAccount = getAssociatedTokenAddressSync(
            personalLstMint,
            provider.publicKey,
            true
        );

        await initializeAta(
            personalLstMint,
            provider.publicKey,
            provider
        );

        // const [stakeReserve] = PublicKey.findProgramAddressSync(
        //     [
        //         stakePool.toBuffer(),
        //         Buffer.from("stake_reserve")
        //     ],
        //     program.programId
        // );

        const stakeReserve = Keypair.generate();

        let lamports = await provider.connection.getMinimumBalanceForRentExemption(200, "confirmed");
        const stakeReserveIx = SystemProgram.createAccount({
            programId: StakeProgram.programId,
            space: 200,
            lamports,
            fromPubkey: provider.publicKey,
            newAccountPubkey: stakeReserve.publicKey
        });

        // const [validatorList] = PublicKey.findProgramAddressSync(
        //     [
        //         stakePool.toBuffer(),
        //         Buffer.from("ramp_val_list")
        //     ],
        //     program.programId
        // );

        const validatorList = Keypair.generate();
        lamports = await provider.connection.getMinimumBalanceForRentExemption(8 + 4 + 1 + 4 + (8 * (73)));
        const validatorListIx = SystemProgram.createAccount({
            programId: stakePoolProgram,
            space: 8 + 4 + 1 + 4 + (8 * (73)),
            lamports,
            fromPubkey: provider.publicKey,
            newAccountPubkey: validatorList.publicKey
        });

        const [depositAuthority] = PublicKey.findProgramAddressSync(
            [
                stakePool.toBuffer(),
                Buffer.from("deposit"),
            ],
            stakePoolProgram,
        )

        const personalLstMetadata = metaplex
            .nfts()
            .pdas()
            .metadata({
                mint: personalLstMint
            });

        const ix = await program
            .methods
            .initializeStakePool()
            .accounts({
                admin: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                stakeProgram: StakeProgram.programId,
                stakePool,
                stakeReserve: stakeReserve.publicKey,
                validatorList: validatorList.publicKey,
                stakePoolProgram,
                personalLstMint,
                withdrawAuthority,
                managerPoolAccount,
                rent: SYSVAR_RENT_PUBKEY,
                metaplexProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
                personalLstMetadata
            })
            .instruction();

        const tx = new Transaction();

        tx.add(stakeReserveIx);
        tx.add(validatorListIx);
        tx.add(ix);

        const {
            lastValidBlockHeight,
            blockhash
        } = await provider.connection.getLatestBlockhash();

        tx.feePayer = provider.publicKey;
        tx.recentBlockhash = blockhash;

        tx.sign(stakeReserve, validatorList);

        const signed = await provider.wallet.signTransaction(tx);

        const {
            epoch
        } = await provider.connection.getEpochInfo();
        const txId = await provider.connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });

        await provider.connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature: txId
        }, "confirmed");

        const txId2 = await program
            .methods
            .initializeRamp()
            .accounts({
                admin: provider.publicKey,
                ramp: rampProtocol,
                systemProgram: SystemProgram.programId,
                defaultLst: personalLstMint,
                defaultStakePool: stakePool
            })
            .rpc();

        console.log({
            ramp: rampProtocol.toString(),
            systemProgram: SystemProgram.programId.toString(),
            admin: provider.publicKey.toString(),
            defaultLst: personalLstMint.toString(),
            defaultStakePool: stakePool.toString()
        });

        {
            const {
                lastValidBlockHeight,
                blockhash
            } = await provider.connection.getLatestBlockhash();

            await provider.connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature: txId2
            }, "confirmed");
        }

        const parsedTx = await provider.connection.getParsedTransaction(txId2, "confirmed");
        if (!parsedTx?.meta) throw null;

        const {
            logMessages
        } = parsedTx.meta;

        console.log(logMessages);

        const {
            admin,
            index,
            defaultCurrency,
        } = await RampProtocol.fromAccountAddress(
            provider.connection,
            rampProtocol
        );

        console.log({ admin: admin.toString(), defaultCurrency: defaultCurrency.toString() });

        expect(index.toString()).eq("0");
        expect(admin.toString()).eq(provider.publicKey.toString());
        expect(defaultCurrency.toString()).eq(personalLstMint.toString());
    });

    it("Creates account and personal market.", async () => {
        const [personalMarket] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("personal_market"),
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
        );

        const [userRampAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("user_account"),
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
        );

        const [userRampAccountVault] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("vault"),
                userRampAccount.toBuffer(),
            ],
            program.programId
        );

        await program
            .methods
            .createAccount(
                "zkchakra",
                { linear: {} }
            )
            .accounts({
                systemProgram: SystemProgram.programId,
                user: provider.wallet.publicKey,
                personalMarket,
                userRampAccount,
                rampProtocol,
                userRampAccountVault
            })
            .rpc();
    });

    it("Creates personal LST.", async () => {
        const [personalMarket] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("personal_market"),
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
        );

        const personalLstMint = await createToken(
            provider.connection,
            provider
        );

        const [stakePool] = PublicKey.findProgramAddressSync(
            [
                provider.wallet.publicKey.toBuffer(),
                Buffer.from("personal_stake_pool")
            ],
            program.programId
        );

        const [withdrawAuthority] = PublicKey.findProgramAddressSync(
            [
                stakePool.toBuffer(),
                Buffer.from("withdraw")
            ],
            stakePoolProgram
        );

        console.log({ withdrawAuthority: withdrawAuthority.toString() });

        await transferAuthority(
            personalLstMint,
            provider,
            AuthorityType.MintTokens,
            withdrawAuthority
        );

        await transferAuthority(
            personalLstMint,
            provider,
            AuthorityType.FreezeAccount,
            null
        );

        const [rampUserAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("user_account"),
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
        );

        const managerPoolAccount = getAssociatedTokenAddressSync(
            personalLstMint,
            rampUserAccount,
            true
        );

        await initializeAta(
            personalLstMint,
            rampUserAccount,
            provider
        );

        // const [stakeReserve] = PublicKey.findProgramAddressSync(
        //     [
        //         stakePool.toBuffer(),
        //         Buffer.from("stake_reserve")
        //     ],
        //     program.programId
        // );

        const stakeReserve = Keypair.generate();

        let lamports = await provider.connection.getMinimumBalanceForRentExemption(200, "confirmed");
        const stakeReserveIx = SystemProgram.createAccount({
            programId: StakeProgram.programId,
            space: 200,
            lamports,
            fromPubkey: provider.publicKey,
            newAccountPubkey: stakeReserve.publicKey
        });

        // const [validatorList] = PublicKey.findProgramAddressSync(
        //     [
        //         stakePool.toBuffer(),
        //         Buffer.from("ramp_val_list")
        //     ],
        //     program.programId
        // );

        const validatorList = Keypair.generate();
        lamports = await provider.connection.getMinimumBalanceForRentExemption(8 + 4 + 1 + 4 + (8 * (73)));
        const validatorListIx = SystemProgram.createAccount({
            programId: stakePoolProgram,
            space: 8 + 4 + 1 + 4 + (8 * (73)),
            lamports,
            fromPubkey: provider.publicKey,
            newAccountPubkey: validatorList.publicKey
        });

        const [depositAuthority] = PublicKey.findProgramAddressSync(
            [
                stakePool.toBuffer(),
                Buffer.from("deposit"),
            ],
            stakePoolProgram,
        )

        const personalLstMetadata = metaplex
            .nfts()
            .pdas()
            .metadata({
                mint: personalLstMint
            });

        const ix = await program
            .methods
            .createPersonalLst(
                "zkchakra Personal LST",
                "chakraSOL",
                "https://raw.githubusercontent.com/"
            )
            .accounts({
                user: provider.wallet.publicKey,
                personalMarket,
                rampUserAccount,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                stakeProgram: StakeProgram.programId,
                stakePool,
                stakeReserve: stakeReserve.publicKey,
                validatorList: validatorList.publicKey,
                stakePoolProgram,
                personalLstMint,
                withdrawAuthority,
                managerPoolAccount,
                rent: SYSVAR_RENT_PUBKEY,
                metaplexProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
                personalLstMetadata
            })
            .instruction();

        const tx = new Transaction();

        tx.add(stakeReserveIx);
        tx.add(validatorListIx);
        tx.add(ix);

        const {
            lastValidBlockHeight,
            blockhash
        } = await provider.connection.getLatestBlockhash();

        tx.feePayer = provider.publicKey;
        tx.recentBlockhash = blockhash;

        tx.sign(stakeReserve, validatorList);

        const signed = await provider.wallet.signTransaction(tx);

        const {
            epoch
        } = await provider.connection.getEpochInfo();
        const txId = await provider.connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });

        await provider.connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature: txId
        }, "confirmed");

        const parsedTx = await provider.connection.getParsedTransaction(txId, "confirmed");
        if (!parsedTx?.meta) throw null;

        const {
            logMessages
        } = parsedTx.meta;

        console.log(logMessages);

        const {
            account: {
                data: {
                    validatorList: stakePoolValidatorList,
                    poolMint,
                    manager,
                    managerFeeAccount,
                    solReferralFee,
                    epochFee,
                    nextSolWithdrawalFee,
                    nextStakeWithdrawalFee,
                    accountType,
                    lastEpochPoolTokenSupply,
                    totalLamports,
                    lastEpochTotalLamports,
                    lockup,
                    lastUpdateEpoch,
                    preferredDepositValidatorVoteAddress,
                    preferredWithdrawValidatorVoteAddress,
                    reserveStake,
                    solDepositAuthority,
                    nextEpochFee,
                    solDepositFee,
                    solWithdrawalFee,
                    solWithdrawAuthority,
                    stakeDepositAuthority,
                    staker,
                    stakeDepositFee,
                    stakeReferralFee,
                    stakeWithdrawBumpSeed,
                    stakeWithdrawalFee: stakePoolWithdrawalFee,
                    tokenProgramId,
                    poolTokenSupply
                }
            }
        } = await getStakePoolAccount(
            provider.connection,
            stakePool
        );

        expect(stakePoolValidatorList.toString()).eq(validatorList.publicKey.toString());
        expect(poolMint.toString()).eq(personalLstMint.toString());
        expect(manager.toString()).eq(rampUserAccount.toString());
        expect(managerFeeAccount.toString()).eq(managerPoolAccount.toString());
        expect(solReferralFee.toString()).eq("0");
        expect(epochFee.numerator.toString()).eq("0");
        expect(epochFee.denominator.toString()).eq("0");
        expect(!!nextSolWithdrawalFee).eq(false);
        expect(!!nextSolWithdrawalFee).eq(false);
        expect(!!nextStakeWithdrawalFee).eq(false);
        expect(!!nextStakeWithdrawalFee).eq(false);
        expect(accountType).eq(1) // AccountType.StakePool
        expect(lastEpochPoolTokenSupply.toString()).eq("0");
        expect(totalLamports.toString()).eq("0");
        expect(lastEpochTotalLamports.toString()).eq("0");
        expect(lockup.epoch.toString()).eq("0");
        expect(lockup.unixTimestamp.toString()).eq("0");
        expect(lockup.custodian.toString()).eq(new PublicKey(0).toString());
        expect(lastUpdateEpoch.toString()).eq(`${epoch}`);
        expect(!!preferredDepositValidatorVoteAddress).eq(false); // whether null or undefined, just empty field
        expect(!!preferredWithdrawValidatorVoteAddress).eq(false); // whether null or undefined, just empty field
        expect(reserveStake.toString()).eq(stakeReserve.publicKey.toString());
        expect(!!solDepositAuthority).eq(false);
        expect(!!nextEpochFee).eq(false);
        expect(solDepositFee.numerator.toString()).eq("0");
        expect(solDepositFee.denominator.toString()).eq("0");
        expect(solWithdrawalFee.numerator.toString()).eq("0");
        expect(solWithdrawalFee.denominator.toString()).eq("0");
        expect(!!solWithdrawAuthority).eq(false);
        expect(stakeDepositAuthority.toString()).eq(depositAuthority.toString());
        expect(staker.toString()).eq(rampUserAccount.toString());
        expect(stakeDepositFee.numerator.toString()).eq("0");
        expect(stakeDepositFee.denominator.toString()).eq("0");
        expect(!!stakeReferralFee).eq(false); // whether 0 or undefined
        expect(stakePoolWithdrawalFee.denominator.toString()).eq("0");
        expect(stakePoolWithdrawalFee.numerator.toString()).eq("0");
        expect(tokenProgramId.toString()).eq(TOKEN_PROGRAM_ID.toString());
        expect(poolTokenSupply.toString()).eq("0");

        const {
            validatorList: stakePoolValidators,
            maxValidators,
        } = await stakePoolInfo(
            provider.connection,
            stakePool
        );

        expect(stakePoolValidators.length).eq(0);
        expect(maxValidators).eq(8);

        const {
            marketCurrency
        } = await PersonalMarket.fromAccountAddress(
            provider.connection,
            personalMarket
        );

        expect(marketCurrency.toString()).eq(personalLstMint.toString());

        const {
            personalLst,
            personalStakePool
        } = await RampAccount.fromAccountAddress(
            provider.connection,
            rampUserAccount
        );

        expect(personalLst?.toString()).eq(personalLstMint.toString());
        expect(personalStakePool?.toString()).eq(stakePool.toString());
    });

    it("Purchases a share.", async () => {
        const [personalMarket] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("personal_market"),
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
        );

        const [creatorRampAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("user_account"),
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
        );

        const bob = Keypair.generate();
        const airdropTx = await provider.connection.requestAirdrop(bob.publicKey, 500 * LAMPORTS_PER_SOL);
        await provider.connection.confirmTransaction(airdropTx);

        const [buyerRampAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("user_account"),
                bob.publicKey.toBuffer()
            ],
            program.programId
        );

        const [rampUserAccountVault] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("vault"),
                buyerRampAccount.toBuffer(),
            ],
            program.programId
        );

        const [buyerPersonalMarket] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("personal_market"),
                bob.publicKey.toBuffer()
            ],
            program.programId
        );

        const createAccountIx = await program
            .methods
            .createAccount(
                "bob",
                { linear: {} }
            )
            .accounts({
                user: bob.publicKey,
                personalMarket: buyerPersonalMarket,
                rampProtocol,
                systemProgram: SystemProgram.programId,
                userRampAccount: buyerRampAccount,
                userRampAccountVault: rampUserAccountVault
            })
            .instruction();

        const {
            marketCurrency,
            marketStakePool
        } = await PersonalMarket.fromAccountAddress(
            provider.connection,
            personalMarket
        );

        const stakePoolData = await stakePoolInfo(
            provider.connection,
            // @ts-ignore
            marketStakePool
        );

        console.log({
            poolMint: stakePoolData.poolMint,
            marketCurrency: marketCurrency.toString()
        });

        const {
            validatorListStorageAccount,
            reserveStake,
            managerFeeAccount,
            poolWithdrawAuthority
        } = stakePoolData;

        const rampUserAccountLstVault = getAssociatedTokenAddressSync(
            marketCurrency,
            buyerRampAccount,
            true
        );

        const ataIx = createAssociatedTokenAccountInstruction(
            bob.publicKey,
            rampUserAccountLstVault,
            buyerRampAccount,
            marketCurrency
        );

        const buyShareIx = await program
            .methods
            .purchaseShare(
                provider.publicKey
            )
            .accounts({
                user: bob.publicKey,
                personalMarket,
                rampUserAccount: buyerRampAccount,
                stakePoolProgram: stakePoolProgram,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                stakeProgram: StakeProgram.programId,
                marketCurrency,
                // @ts-ignore // We are sure that personal stake pool exists
                stakePool: marketStakePool,
                stakeReserve: new PublicKey(reserveStake),
                managerFeeAccount: new PublicKey(managerFeeAccount),
                withdrawAuthority: new PublicKey(poolWithdrawAuthority),
                sellerUserAccount: creatorRampAccount,
                rampUserAccountLstVault,
                rampUserAccountVault
            })
            .instruction();

        const tx = new Transaction();
        tx.add(createAccountIx);
        tx.add(ataIx);
        tx.add(buyShareIx);

        const {
            lastValidBlockHeight,
            blockhash
        } = await provider.connection.getLatestBlockhash();

        tx.recentBlockhash = blockhash;
        tx.feePayer = bob.publicKey;

        tx.sign(bob);

        const txId = await provider.connection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
        await provider.connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature: txId
        }, "confirmed");

        const parsedTx = await provider.connection.getParsedTransaction(txId, "confirmed");
        expect(parsedTx).to.not.eq(null);
        expect(parsedTx?.meta).to.not.eq(null);
        if (!parsedTx || !parsedTx.meta) return;

        const {
            meta: {
                logMessages
            }
        } = parsedTx;

        console.log(logMessages);
    });
});

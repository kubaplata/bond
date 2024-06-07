import * as anchor from "@coral-xyz/anchor";
import {AnchorProvider, Program} from "@coral-xyz/anchor";
import { Ramp } from "../target/types/ramp";
import {
    Connection,
    Keypair,
    PublicKey,
    StakeProgram,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction
} from "@solana/web3.js";
import {BondingCurveMode, RampProtocol} from "../sdk";
import {expect} from "chai";
import {
    AuthorityType,
    createAssociatedTokenAccountIdempotentInstruction, createInitializeMintInstruction,
    createMintToInstruction, createSetAuthorityInstruction, getAssociatedTokenAddressSync, MINT_SIZE,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {Metaplex} from "@metaplex-foundation/js";

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

    it('Initializes Ramp protocol.', async () => {

        const defaultLst = Keypair.generate().publicKey;

        await program
            .methods
            .initializeRamp(
                defaultLst
            )
            .accounts({
                ramp: rampProtocol,
                systemProgram: SystemProgram.programId,
                admin: provider.publicKey
            })
            .rpc();

        const {
            admin,
            index,
            defaultCurrency
        } = await RampProtocol.fromAccountAddress(
            provider.connection,
            rampProtocol
        );

        expect(index.toString()).eq("0");
        expect(admin.toString()).eq(provider.publicKey.toString());
        expect(defaultCurrency.toString()).eq(defaultLst.toString());
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
                rampProtocol
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
        const txId = await provider.connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });

        await provider.connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature: txId
        }, "confirmed");

        const {
            meta: {
                logMessages
            }
        } = await provider.connection.getParsedTransaction(txId, "confirmed");

        console.log(logMessages);
    });
});

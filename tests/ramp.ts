import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ramp } from "../target/types/ramp";
import {Keypair, PublicKey, StakeProgram, SystemProgram} from "@solana/web3.js";
import {BondingCurveMode, RampProtocol} from "../sdk";
import {expect} from "chai";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";

describe("ramp", () => {
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const program = anchor.workspace.Ramp as Program<Ramp>;

    let rampProtocol: PublicKey;

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

        const [rampUserAccount] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("user_account"),
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
        );

        program
            .methods
            .createPersonalLst()
            .accounts({
                user: provider.wallet.publicKey,
                personalMarket,
                rampUserAccount,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                stakeProgram: StakeProgram.programId,
                stakePool
            })
    });
});

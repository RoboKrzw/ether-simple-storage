const {deployments, ethers, getNamedAccounts} = require("hardhat")
const {assert, expect} = require("chai")
const {developmentChains} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
        let fundMe
        let deployer
        let mockV3Aggregator
        const sentValue = ethers.utils.parseEther("1") //1eth

        beforeEach(async function() {
            // deploy our fund me contract
            // we need to abstract just the deployer from getNamedAccounts
            deployer = (await getNamedAccounts()).deployer

            // tags - w folderze DEPLOY obydwa pliki posiadaja module.exports.tags. 
            // Metoda fixture pozwala na zdeployowanie wszystkich tych, których tag ujęty jest jako argument.
            await deployments.fixture(["all"]);

            // getContract pobiera wszystkie najswiezsze wersje zdeployowanych kontraktow
            fundMe = await ethers.getContract("FundMe", deployer)
            mockV3Aggregator = await ethers.getContract(
                "MockV3Aggregator",
                deployer
            )
        })

        describe("constructor", async function(){
            it("sets the aggregator addresses correctly", async function(){
                // FundMe.sol -> contract FundMe -> state variables
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })

        describe("fund", async function(){
            it("fails if u dont send enough ETH", async function(){
                // tutaj spodziewamy się ze wartość będzie zbyt mała - tym samym nasz test bd positive
                await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
            })

            // w terminalu mozemy napisac npx hardhat test --grep "amount funded"
            // dzieki temu dokona się test który w tytule posiada wymieniona frazę
            it("updates the amount funded data structure", async function(){
                await fundMe.fund({value: sentValue})
                const response = await fundMe.getAddressToAmountFunded(deployer)
                assert.equal(response.toString(), sentValue.toString())
            })
            it("adds funders to array of Funders", async function(){
                await fundMe.fund({value: sentValue})
                const funder = await fundMe.getFunder(0)
                assert.equal(funder, deployer)
            })
        })

        describe("withdraw", async function(){
            // first we need to make sure that there is some money on the contract
            beforeEach(async function(){
                await fundMe.fund({value: sentValue})
            })

            it("withdraw ETH from a single funder", async function(){
                // arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                // act
                // const transactionResponse = await fundMe.withdraw()
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                // mul stands for multiply - another BigNumber method
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance =  await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                // gasCost ???


                // assert
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    // startingDeployerBalance + startingFundMeBalance,
                    // zamiast powyzszego lepiej uzyc funkcji BigNumbers, mianowicie ADD
                    startingDeployerBalance.add(startingFundMeBalance).toString(),

                    // zawsze nalezy pamietac o gasCost!!!!!!!!!!!!!!!!!!
                    endingDeployerBalance.add(gasCost).toString()
                )
            })

            it("allows us to withdraw with multiple funders", async function(){
                // arrange
                const accounts = await ethers.getSigners()
                for(let i = 1; i > 6; i++){
                    const fundMeConnectedContract = await fundMe.connect(accounts[i])
                    await fundMeConnectedContract.fund({value: sentValue})
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                // act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                // mul stands for multiply - another BigNumber method
                const gasCost = gasUsed.mul(effectiveGasPrice)

                // assert
                // PROVIDER - in ethers is a read-only abstraction to access the blockchain data
                const endingFundMeBalance =  await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    // startingDeployerBalance + startingFundMeBalance,
                    // zamiast powyzszego lepiej uzyc metody BigNumbers, mianowicie ADD
                    startingDeployerBalance.add(startingFundMeBalance).toString(),

                    // zawsze nalezy pamietac o gasCost!!!!!!!!!!!!!!!!!!
                    endingDeployerBalance.add(gasCost).toString()
                )

                // make sure that funders are reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted
                for(let i = 1; i < 6; i++){
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(accounts[i].address), 0
                    )
                }
            })

            it("only allows owner to withdraw", async function(){
                const accounts = await ethers.getSigners()
                // the first account would be some random attacker
                const attacker = accounts[1]
                const attackerConnectedContract = await fundMe.connect(attacker)
                // if we have a custom error we can add it like below (FundMe__NotOwner)
                // instead reverted -> revertedWith()
                // await expect(attackerConnectedContract.withdraw()).to.be.reverted
                await expect(attackerConnectedContract.cheaperWithdraw()).to.be.reverted
            })
        })
    })
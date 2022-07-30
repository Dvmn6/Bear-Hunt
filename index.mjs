import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from './build/index.main.mjs';
import { ask, yesno } from '@reach-sh/stdlib/ask.mjs';

const stdlib = loadStdlib(process.env);
const fmt = (x) => stdlib.formatCurrency(x, 4);

const accBank = await stdlib.newTestAccount(stdlib.parseCurrency(200000));
const accAlice = await stdlib.newTestAccount(stdlib.parseCurrency(3000));
const accBob = await stdlib.newTestAccount(stdlib.parseCurrency(1000));

console.log('Hello Alice and Bob');
console.log('Launching');

const ctcBank = accBank.contract(backend);
const ctcAlice = accAlice.contract(backend, ctcBank.getInfo())
const ctcBob = accBob.contract(backend, ctcBank.getInfo())

const getBalance = async (who) => fmt(await stdlib.balanceOf(who));

console.log(`Alice balance is: ${await getBalance(accAlice)}`)
console.log(`Bob balance is: ${await getBalance(accBob)}`)
console.log(`Bank balance is: ${await getBalance(accBank)}`);

const Shared = () =>({
  decision: (final) => {
    if(final){
      console.log(`Alice gets back her inheritance `)
    }
    else {
      console.log(`Alice Lost her inheritance `)
      console.log('CONGRATULATIONS BOB YOU GOT THE INHERITANCE')
    }
  },
  informTimeout: () => {
    console.log(`${who} observed a timeout`);
  },
});


console.log('Starting backend....');
await Promise.all([
  backend.Bank(ctcBank,{
    inheritance: async () =>{
      const amt = stdlib.parseCurrency(5000);
      return amt;
    },

  }),
  backend.Alice(ctcAlice, {
    ...Shared('Alice'),
    verification: async () =>{
      const choice = await ask(`Alice are you present?`, yesno );
      if(choice){
        console.log('Alice is here');
      }
      else console.log('Alice isnt here ');
    return choice;
    },
    accepted: async (t) => {
      const vaultTerms = parseInt(t);
      const terms = await ask(`Alice do you accept the terms of ${fmt(vaultTerms)} tokens from the Bank? : `, yesno);
      if(terms){
        return terms;
      }
      else process.exit();
    }

  }),
  backend.Bob(ctcBob, {
    ...Shared('Bob'),
    acceptFunds: async (t) =>{
      const vaultTerms = parseInt(t);
      const terms = await ask(`Bob do you accept the terms of ${fmt(vaultTerms)} tokens? : `, yesno);
      if(terms){
        return terms;
      }
      else process.exit();
    }
  })
]);

console.log(`Alice balance is: ${await getBalance(accAlice)}`);
console.log(`Bob balance is: ${await getBalance(accBob)}`);
console.log(`Bank balance is: ${await getBalance(accBank)}`);


console.log('GoodBye');
process.exit();
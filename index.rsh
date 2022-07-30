"reach 0.1";

const Shared = {

  decision: Fun([Bool], Null),
  informTimeout: Fun([], Null)
};

export const main = Reach.App(() => {
  const Bank = Participant('Bank', {
    inheritance: Fun([], UInt),
  })
  const Alice = Participant('Alice', {
    ...Shared,
    accepted: Fun([UInt], Bool),
    verification: Fun([], Bool),
  });
  const Bob = Participant('Bob', {
    ...Shared,
    acceptFunds: Fun([UInt], Bool),
  });
  init();

  const informTimeout = () => {
    each([Alice, Bob], () => {
      interact.informTimeout();
    });
  };
  const result = (status, time, end, deposit) => {
    if (time >= end && status){
      transfer(deposit).to(Alice)
      each([Alice, Bob], () => {
        interact.decision(true);
      });
    }
    else{
      transfer(deposit).to(Bob)
      each([Alice, Bob], () => {
        interact.decision(false);
      });
    }
    transfer(balance()).to(Alice)
  };

  Bank.only(() => {
    const deposit = declassify(interact.inheritance());
 
  })
  Bank.publish(deposit);
  commit();
  Bank.pay(deposit);
  commit();
  Alice.only(() => {
    const accepted = declassify(interact.accepted(deposit));
  }) 
  Alice.publish(accepted);
  commit();
  Bob.only(() => {
    const acceptedTerms = declassify(interact.acceptFunds(deposit));
  })
  Bob.publish(acceptedTerms); 
  const deadline = 3;
  const countdown = lastConsensusTime() + deadline
  var [status,time, end] = [false,lastConsensusTime(), countdown ];
  invariant(balance() == deposit);
  while ( time <= end ) {
    commit();
    Alice.only(() => {
     const verify = declassify(interact.verification());
    });

    Alice.publish(verify)
      .timeout(relativeTime(end), () => closeTo(Bob, informTimeout));
    commit();
    Bob.publish();
    [status,time ,end] = [verify, lastConsensusTime()+1, countdown];
    continue;
  }
  const p = result( status, time, end,   deposit);
  commit();
});
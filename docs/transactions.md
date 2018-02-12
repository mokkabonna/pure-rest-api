# Transactions

How to deal with one public operation that result in several internal calls?

I need a system that does transaction like operations. Maybe I can use the REST fundamentals in terms of idempotency etc to later do cleanup if something fails?

Maybe give the store direct capabilities to create a transaction and then commit it when all parts of the transaction have reached the store.

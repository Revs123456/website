// Runs before every unit test suite. Provides dummy env vars so services that
// throw on missing config (AuthService, UsersService, PaymentsService, ...)
// can be instantiated in isolation, without touching real secrets.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-not-for-production-use-only';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_key_secret';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

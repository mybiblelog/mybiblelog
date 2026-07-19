// Maestro runScript: generate a unique throwaway email address for a flow that
// needs to register or change to a brand-new address, exposed as output.newEmail.
output.newEmail = 'test_e2e_' + Date.now() + '@example.com';

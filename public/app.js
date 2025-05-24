// Client-side Vue App - public/app.js

const app = Vue.createApp({
    data() {
        return {
            loading: false,
            users: [],
            currentUser: { id: null, username: '', email: '', password: '' }, 
            showForm: false,
            isEditMode: false,
            formError: '',
            successMessage: '',
            apiService: null,
            messageTimeout: null // To store timeout ID for clearing
        };
    },
    computed: {
        formTitle() {
            return this.isEditMode ? 'Edit User' : 'Add New User';
        }
    },
    methods: {
        setSuccessMessage(message) {
            this.successMessage = message;
            this.formError = ''; // Clear any previous error
            if (this.messageTimeout) clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => this.successMessage = '', 3000);
        },

        setErrorMessage(message) {
            this.formError = message;
            this.successMessage = ''; // Clear any previous success message
            if (this.messageTimeout) clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => this.formError = '', 5000); // Errors stay a bit longer
        },
        
        clearMessages() { // Now primarily used internally by setSuccess/ErrorMessage or explicitly
            this.formError = '';
            this.successMessage = '';
            if (this.messageTimeout) clearTimeout(this.messageTimeout);
        },

        async fetchUsers() {
            this.clearMessages();
            this.loading = true;
            try {
                this.users = await this.apiService.getUsers();
            } catch (err) {
                this.setErrorMessage('Error fetching users: ' + (err.message || 'Unknown error'));
                this.users = [];
            } finally {
                this.loading = false;
            }
        },

        openAddUserForm() {
            this.clearMessages(); // Clear messages when opening form
            this.isEditMode = false;
            this.currentUser = { id: null, username: '', email: '', password: '' };
            this.showForm = true;
        },

        openEditUserForm(user) {
            this.clearMessages(); // Clear messages when opening form
            this.isEditMode = true;
            this.currentUser = { ...user, password: '' };
            this.showForm = true;
        },

        async submitUserForm() {
            // Don't clear messages here, let setSuccess/ErrorMessage handle it
            if (!this.currentUser.username || !this.currentUser.email || (!this.isEditMode && !this.currentUser.password)) {
                this.setErrorMessage("Username, email, and password (for new users) are required.");
                return;
            }
            
            this.loading = true;
            try {
                if (this.isEditMode) {
                    if (!this.currentUser.id) {
                        throw new Error("User ID is missing for update.");
                    }
                    await this.apiService.updateUser(this.currentUser.id, this.currentUser);
                    this.setSuccessMessage('User updated successfully!');
                } else {
                    await this.apiService.addUser(this.currentUser);
                    this.setSuccessMessage('User added successfully!');
                }
                this.closeForm();
                await this.fetchUsers();
            } catch (err) {
                this.setErrorMessage('Error submitting form: ' + (err.message || 'Unknown error'));
            } finally {
                this.loading = false;
            }
        },

        async confirmDeleteUser(userId) {
            // Don't clear messages here initially
            if (window.confirm('Are you sure you want to delete this user?')) {
                this.clearMessages(); // Clear messages before new action
                this.loading = true;
                try {
                    await this.apiService.deleteUser(userId);
                    this.setSuccessMessage('User deleted successfully!');
                    await this.fetchUsers();
                } catch (err) {
                    this.setErrorMessage('Error deleting user: ' + (err.message || 'Unknown error'));
                } finally {
                    this.loading = false;
                }
            }
        },

        closeForm() {
            this.showForm = false;
            this.isEditMode = false;
            this.currentUser = { id: null, username: '', email: '', password: '' };
            // Do not clear general error messages when just closing form, they might be from fetchUsers etc.
            // If formError is specific to the form's content, it's cleared by setErrorMessage on next submit
        },
        
        // clearMessages is now mainly for explicit calls or internal use by setSuccess/ErrorMessage
    },
    mounted() {
        if (typeof apiService !== 'undefined') {
            this.apiService = apiService;
            this.fetchUsers();
        } else {
            console.error('apiService is not loaded. Ensure apiService.js is included before app.js.');
            this.setErrorMessage('API service failed to load. Please refresh.');
        }
    }
});

app.mount('#app');

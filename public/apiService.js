// Client-side API Service - public/apiService.js

const BASE_URL = ''; // Assuming API is served from the same origin

async function handleResponse(response) {
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        // Handle non-JSON responses if necessary, or assume error for now
        data = { message: await response.text() || response.statusText };
    }

    if (!response.ok) {
        const error = (data && (data.error || data.message)) || response.statusText;
        throw new Error(error);
    }
    return data;
}

const apiService = {
    getUsers: async () => {
        const response = await fetch(`${BASE_URL}/users`);
        return handleResponse(response);
    },

    addUser: async (userData) => {
        const response = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    updateUser: async (userId, userData) => {
        // Ensure password is not sent if it's empty or not being changed
        const payload = { ...userData };
        if (payload.password === '' || payload.password === undefined) {
            delete payload.password;
        }

        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    deleteUser: async (userId) => {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    }
};

// If using this as a module with <script type="module"> in index.html, use:
// export default apiService; 
// For now, it will be loaded via a separate <script> tag and be globally available
// or explicitly attached to the Vue app instance.

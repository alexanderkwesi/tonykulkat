# Use the lightweight nginx image
FROM nginx:alpine

# Remove default html files
RUN rm -rf /usr/share/nginx/html/*

# Copy everything in the project folder to the nginx html folder
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 5700

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

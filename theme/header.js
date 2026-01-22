// Make the menu title clickable and link to home page
document.addEventListener('DOMContentLoaded', function() {
    const menuTitle = document.querySelector('.menu-title');
    if (menuTitle && !menuTitle.querySelector('a')) {
        // Calculate relative path to index.html
        // mdBook provides path_to_root variable
        const rootPath = window.path_to_root || '';
        const indexPath = rootPath + 'index.html';
        
        // Wrap the title in a link
        const titleText = menuTitle.textContent.trim();
        menuTitle.innerHTML = `<a href="${indexPath}" style="text-decoration: none; color: inherit;">${titleText}</a>`;
        
        // Add hover effect
        const link = menuTitle.querySelector('a');
        link.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
        });
        link.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    }
});

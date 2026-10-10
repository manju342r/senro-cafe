with open('src/index.css', 'r') as f:
    content = f.read()

content = content.replace('@import "tailwindcss";', "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&display=swap');\n@import \"tailwindcss\";", 1)

with open('src/index.css', 'w') as f:
    f.write(content)

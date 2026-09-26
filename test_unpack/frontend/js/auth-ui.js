

document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("session"));
  
  if (!session || !session.token) {
    window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : './index.html';
    return;
  }

  const role = session.role;
  if (role) {
    document.body.classList.add("role-" + role);
  }
});
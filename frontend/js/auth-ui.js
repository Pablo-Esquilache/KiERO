document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("session"));
  
  if (!session || !session.token) {
    if (window.location.pathname.includes('/pages/')) {
        window.location.href = "../index.html";
      } else {
        window.location.href = "index.html";
      }
    return;
  }

  const role = session.role;
  if (role) {
    document.body.classList.add("role-" + role);
  }
});

<template>
  <footer class="footer">
    <div class="footer-top">
      <div class="grid">
        <!-- Columna 1 -->
        <div class="brand">
          <div class="brand-head">
            <img class="logo" src="../store/logo_uce.png" alt="Universidad Central del Ecuador" />
            <div class="brand-name">
              <div>Universidad Central del Ecuador</div>
            </div>
          </div>

          <p class="brand-text">
            La plataforma de Tutorías de la Universidad Central del Ecuador es un espacio académico
            diseñado para apoyar el aprendizaje de los estudiantes mediante cursos y acompañamiento
            guiado por tutores. A través de un entorno simple e interactivo, los usuarios pueden
            inscribirse en cursos, revisar calificaciones, participar en foros, acceder a reuniones
            y dar seguimiento a su progreso, fortaleciendo así su formación con apoyo continuo.
          </p>
        </div>

        <!-- Columna 2 -->
        <div class="col">
          <div class="col-title">Información</div>

          <a class="link-footer" href="https://www.uce.edu.ec/" target="_blank" rel="noopener">
            Sitio Web
          </a>

          <a class="link-footer" href="https://siiu.uce.edu.ec/" target="_blank" rel="noopener">
            Sistema de Información Integral
          </a>
        </div>

        <!-- Columna 3 -->
        <div class="col">
          <div class="col-title">Contáctanos</div>

          <div class="contact-item">
            <FontAwesomeIcon class="icon" :icon="['fas', 'map-pin']" />
            <span>Cdla. Universitaria</span>
          </div>

          <div class="contact-item">
            <FontAwesomeIcon class="icon" :icon="['fas', 'envelope']" />
            <span>Email:</span>
            <a class="link-footer inline" href="mailto:tutorias.uce@gmail.com">
              tutorias.uce@gmail.com
            </a>
          </div>
        </div>

        <!-- Columna 4 -->
        <div class="col">
          <div class="col-title">Síguenos</div>

          <div class="social">
            <a
              class="social-btn"
              href="https://facebook.com/"
              target="_blank"
              rel="noopener"
              aria-label="Facebook"
            >
              <FontAwesomeIcon :icon="['fab', 'square-facebook']" />
            </a>

            <a
              class="social-btn"
              href="https://instagram.com/"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
            >
              <FontAwesomeIcon :icon="['fab', 'square-instagram']" />
            </a>

            <a
              class="social-btn"
              href="https://x.com/"
              target="_blank"
              rel="noopener"
              aria-label="X"
            >
              <FontAwesomeIcon :icon="['fab', 'square-x-twitter']" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">Copyright © 2026 - Todos los derechos reservados</div>
  </footer>
</template>

<script setup></script>

<style scoped>
.footer-top {
  height: 180px;
  background: #0b4f77;
  color: #fff;
  padding: 22px 60px;
  font-size: 16px;
}

.grid {
  display: grid;
  grid-template-columns: 2.3fr 0.6fr 0.7fr 0.4fr;
  gap: 50px;
  align-items: start;
}

.brand-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.logo {
  width: 70px;
  height: 70px;
  border-radius: 999px;
  object-fit: cover;
}

.brand-name {
  font-weight: 500;
  line-height: 1.1;
  color: #d6b14a;
}

.brand-text {
  margin: 0;
  line-height: 1.45;
  text-align: justify;
}

.col-title {
  font-size: 16px;
  font-weight: 800;
  color: #d6b14a;
  margin-bottom: 10px;
  text-align: left;
}

.link-footer {
  display: block;
  color: #fff;
  text-decoration: underline;
  margin: 8px 0;
  text-align: left;
}

.link-footer:hover {
  opacity: 0.8;
}

.link-footer.inline {
  display: inline;
  margin-left: 6px;
}

/* contact */
.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}

.icon {
  width: 16px;
  height: 16px;
  opacity: 0.95;
}

/* social */
.social {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.social-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  text-decoration: none;
}

.social-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
}

/* barra inferior */
.footer-bottom {
  height: 20px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  text-align: center;
  padding: 10px 14px;
}
</style>

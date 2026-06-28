<template>
  <footer class="footer">
    <div class="footer-top">
      <div class="grid">
        <div class="brand">
          <div class="brand-head">
            <img class="logo" src="../store/logo_uce.png" alt="Universidad Central del Ecuador" />
            <div class="brand-name">Universidad Central del Ecuador</div>
          </div>

          <p class="brand-text">
            La plataforma de Tutorías de la Universidad Central del Ecuador es un espacio académico
            diseñado para apoyar el aprendizaje de los estudiantes mediante cursos y acompañamiento
            guiado por tutores. A través de un entorno simple e interactivo, los usuarios pueden
            inscribirse en cursos, revisar calificaciones, participar en foros, acceder a reuniones
            y dar seguimiento a su progreso, fortaleciendo así su formación con apoyo continuo.
          </p>
        </div>

        <div class="col">
          <div class="col-title">Información</div>

          <a class="link-footer" href="https://www.uce.edu.ec/" target="_blank" rel="noopener">
            Sitio web
          </a>

          <a class="link-footer" href="https://siiu.uce.edu.ec/" target="_blank" rel="noopener">
            Sistema de información integral
          </a>
        </div>

        <div class="col">
          <div class="col-title">Contacto</div>

          <div class="contact-item">
            <FontAwesomeIcon class="icon" :icon="['fas', 'map-pin']" />
            <span>Cdla. Universitaria</span>
          </div>

          <div class="contact-item contact-item-wrap">
            <FontAwesomeIcon class="icon" :icon="['fas', 'envelope']" />
            <a class="link-footer inline" href="mailto:tutorias.uce@gmail.com"
              >tutorias.uce@gmail.com</a
            >
          </div>
        </div>

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
.footer {
  margin-top: auto;
}

.footer-top {
  background: #004671;
  color: #fff;
  padding: 24px 20px;
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
  gap: 26px;
  align-items: start;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.brand-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.brand-name,
.col-title {
  font-weight: 700;
  color: #d6b14a;
}

.brand-text {
  margin: 0;
  line-height: 1.55;
  text-align: left;
  color: rgba(255, 255, 255, 0.92);
}

.col-title {
  font-size: 15px;
  margin-bottom: 10px;
  text-align: left;
}

.link-footer {
  display: block;
  color: #fff;
  text-decoration: none;
  margin: 8px 0;
  text-align: left;
  line-height: 1.5;
}

.link-footer:hover {
  text-decoration: underline;
}

.link-footer.inline {
  display: inline;
  margin: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}

.contact-item-wrap {
  align-items: flex-start;
}

.icon {
  width: 14px;
  height: 14px;
  opacity: 0.9;
  margin-top: 3px;
}

.social {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.social-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  text-decoration: none;
  font-size: 18px;
}

.social-btn:hover {
  border-color: rgba(255, 255, 255, 0.65);
}

.footer-bottom {
  background: #1a1a1a;
  color: #fff;
  text-align: center;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }

  .brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .footer-top {
    padding: 20px 16px;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .brand-head,
  .brand-text,
  .col,
  .col-title,
  .link-footer {
    text-align: center;
  }

  .brand-head {
    flex-direction: column;
  }

  .contact-item,
  .social {
    justify-content: center;
  }
}
</style>

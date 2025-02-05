import { wpAPIEndpoint } from 'virtual:studiocms-devapps/endpoints';
import { defineToolbarApp } from 'astro/toolbar';
import { closeOnOutsideClick, createWindowElement } from '../utils/app-utils.js';

export default defineToolbarApp({
	init(canvas, eventTarget) {
		createCanvas();

		document.addEventListener('astro:after-swap', createCanvas);

		closeOnOutsideClick(eventTarget);
		function createCanvas() {
			const windowComponent = createWindowElement(
				`<style>
				#main-container {
					display: flex;
					flex-direction: column;
					height: 100%;
					gap: 24px;
				}

				p {
					margin-top: 0;
				}

				header {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}

				header section {
					display: flex;
					gap: 0.8em;
				}

				header h2 {
					align-items: center;
					font-size: 28px;	
				}

				h2 {
					color: white;
					margin: 0;
					font-size: 18px;
					align-items: center;
				}

				.form-container {
					max-width: 600px;
					margin: 0 auto;
					padding: 16px;
					border: 1px solid #ccc;
					border-radius: 8px;
				}

				.form-group {
					margin-bottom: 12px;
				}

				label {
					display: block;
					margin-bottom: 5px;
					font-weight: bold;
				}

				input[type="text"], select {
					width: 100%;
					padding: 10px;
					border: 1px solid #ccc;
					border-radius: 4px;
					box-sizing: border-box;
				}

				.required {
					color: red;
				}

				.checkbox-group {
					display: flex;
					flex-direction: column;
				}

				.checkbox-item {
					margin-bottom: 10px;
					display: flex;
					align-items: center;
				}

				.submit-btn {
					padding: 10px 20px;
					background-color: #007bff;
					color: white;
					border: none;
					border-radius: 4px;
					cursor: pointer;
				}

				.submit-btn:hover {
					background-color: #0056b3;
				}

				.loading-spinner {
					display: none; /* Hidden by default */
					margin: 0 1rem;
				}

				.loading-active .loading-spinner {
					display: block;
				}

				.form-submit {
					display: flex;
					align-items: center;
				}

			</style>

			<header>
				<section>
					<h2><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2M3.01 12c0-1.3.28-2.54.78-3.66l4.29 11.75c-3-1.46-5.07-4.53-5.07-8.09M12 20.99c-.88 0-1.73-.13-2.54-.37l2.7-7.84l2.76 7.57c.02.04.04.09.06.12c-.93.34-1.93.52-2.98.52m1.24-13.21c.54-.03 1.03-.09 1.03-.09c.48-.06.43-.77-.06-.74c0 0-1.46.11-2.4.11c-.88 0-2.37-.11-2.37-.11c-.48-.02-.54.72-.05.75c0 0 .46.06.94.09l1.4 3.84l-1.97 5.9l-3.27-9.75c.54-.02 1.03-.08 1.03-.08c.48-.06.43-.77-.06-.74c0 0-1.46.11-2.4.11c-.17 0-.37 0-.58-.01C6.1 4.62 8.86 3.01 12 3.01c2.34 0 4.47.89 6.07 2.36c-.04 0-.08-.01-.12-.01c-.88 0-1.51.77-1.51 1.6c0 .74.43 1.37.88 2.11c.34.6.74 1.37.74 2.48c0 .77-.3 1.66-.68 2.91l-.9 3zm6.65-.09a8.99 8.99 0 0 1-3.37 12.08l2.75-7.94c.51-1.28.68-2.31.68-3.22c0-.33-.02-.64-.06-.92"/></svg> Wordpress Importer</h2>
				</section>
			</header>
			<hr />

			<div id="main-container">
					<div class="importer">
						<p class="importer-description">Import posts and pages into StudioCMS from a WordPress site. <br />(Requires StudioCMS)</p>
						<section id="importer-body">
							<form id="importer-form">
								<div class="form-container">
								<div class="form-group">
									<label for="importer-url">WordPress URL<span class="required">*</span></label>
									<input type="text" id="importer-url" name="importer-url" placeholder="https://your-domain.com" required>
								</div>
								
								<div class="form-group">
									<label for="importer-type">Import Type<span class="required">*</span></label>
									<select id="importer-type" name="importer-type" required>
									<option value="pages" selected>Pages</option>
									<option value="posts">Posts</option>
									<option value="settings">Site Settings (This option will override your StudioCMS Site Config)</option>
									</select>
								</div>

								<div class="form-group">
									<label for="importer-plugins">Use Plugins</label>
									<div class="checkbox-group">
									<div class="checkbox-item">
										<input type="checkbox" id="importer-plugins-0" name="importer-plugins[]" value="blog-plugin">
										<label for="importer-plugins-0">@studiocms/blog (Available for the Posts type)</label>
									</div>
									</div>
								</div>
								
								<div class="form-group form-submit">
									<button type="submit" class="submit-btn">Submit</button>
									<div class="loading-spinner">
										<!-- SVG for loading -->
										<svg xmlns="http://www.w3.org/2000/svg" style="margin:auto; background:none; display:block;" width="50px" height="50px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
										<circle cx="50" cy="50" fill="none" stroke="#007bff" stroke-width="8" r="35" stroke-dasharray="164.93361431346415 56.97787143782138">
											<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform>
										</circle>
										</svg>
									</div>
								</div>
								</div>
							</form>
						</section>
					</div>
				</div>
		`
			);

			const form = windowComponent.querySelector<HTMLFormElement>('#importer-form');

			form?.addEventListener('submit', async (event) => {
				event.preventDefault();

				form.classList.add('loading-active'); // Show spinner

				const url = form.querySelector<HTMLInputElement>('#importer-url')?.value;
				const type = form.querySelector<HTMLSelectElement>('#importer-type')?.value;
				const plugins = form.querySelectorAll<HTMLInputElement>(
					'input[name="importer-plugins[]"]:checked'
				);

				const useBlogPlugin = Array.from(plugins).some(
					(checkbox) => checkbox.value === 'blog-plugin'
				);

				if (!url || !type) {
					alert('Please fill in the required fields');
					form.classList.remove('loading-active');
					return;
				}

				const formData = new FormData();

				formData.append('url', url);
				formData.append('type', type);
				formData.append('useBlogPlugin', useBlogPlugin ? 'true' : 'false');

				console.log('formData', formData);

				const response = await fetch(wpAPIEndpoint, {
					method: 'POST',
					body: formData,
				});

				const responseStatus = response.status;
				const responseText = response.statusText;
				form.classList.remove('loading-active');

				if (responseStatus === 200) {
					alert(
						'Imported successfully! You can now view/edit the imported content in your StudioCMS dashboard.'
					);
				} else {
					alert(`Failed to import: ${responseText}`);
				}
			});

			canvas.append(windowComponent);
		}
	},
});

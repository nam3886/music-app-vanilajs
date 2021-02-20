const PLAYER_STORAGE_KEY = "PLAYER_MUSIC";

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const dashboard = $(".dashboard");
const cd = $(".cd");
const playlist = $(".playlist");
const audio = $("#audio");
const heading = $("header h2");
const cdThumb = $(".cd-thumb");
const progress = $("#progress");
const player = $(".player");
const playBtn = $(".btn.btn-toggle-play");
const nextBtn = $(".btn.btn-next");
const prevBtn = $(".btn.btn-prev");
const randomBtn = $(".btn.btn-random");
const repeatBtn = $(".btn.btn-repeat");
const songDuration = $(".song-time .duration");
const songCurrentTime = $(".song-time .current");

const app = {
	currentIndex: 0,

	isPlaying: false,

	isSeeking: false,

	isRandom: false,

	isRepeat: false,

	config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},

	songs: [
		{
			name: "Anh-Lam-Gi-Sai",
			singer: "Chau Khai Phong",
			path: "./assets/music/Anh-Lam-Gi-Sai-Chau-Khai-Phong-ACV.mp3",
			image: "./assets/img/782949d2dbc28e7cd39fad36505a714f.jpg",
		},
		{
			name: "Anh-Te-Lam",
			singer: "Duong Hoang Yen",
			path: "./assets/music/Anh-Te-Lam-Duong-Hoang-Yen.mp3",
			image: "./assets/img/67693537376ba4c0cb022326394718ee.jpg",
		},
		{
			name: "Lan-Cuoi",
			singer: "Karik",
			path: "./assets/music/Lan-Cuoi-Karik.mp3",
			image: "./assets/img/2486d1faa0e8cfcca01c39b5814113f2.jpg",
		},
		{
			name: "Loi-Xin-Loi-Vung-Ve",
			singer: "Quan AP",
			path: "./assets/music/Loi-Xin-Loi-Vung-Ve-Quan-A-P.mp3",
			image: "./assets/img/80677a86fdcee35d96f0047c7addcc7c.jpg",
		},
		{
			name: "Nguoi-Yeu-Gian-Don",
			singer: "Chi Dan",
			path: "./assets/music/Nguoi-Yeu-Gian-Don-Chi-Dan.mp3",
			image: "./assets/img/84c436b697c9ac4ad9900de45af388a6.jpg",
		},
	],

	randomSongsPlayed: [],

	setConfig: function (key, value) {
		this.config[key] = value;
		localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
	},

	render: function () {
		const htmls = this.songs.map((song, index) => {
			return `
							<div class='song ${
								index === this.currentIndex ? "active" : ""
							}' data-index='${index}'>
								<div
									class="thumb"
									style="
										background-image: url('${song.image}');
									"
								></div>
								<div class="body">
									<h3 class="title">${song.name}</h3>
									<p class="author">${song.singer}</p>
								</div>
								<div class="option">
									<i class="fas fa-ellipsis-h"></i>
								</div>
							</div>
						`;
		});

		playlist.innerHTML = htmls.join("");
	},

	defineProperties: function () {
		Object.defineProperty(this, "currentSong", {
			get: function () {
				return this.songs[this.currentIndex];
			},
		});

		Object.defineProperty(this, "songActiveIsHidden", {
			get: function () {
				const activeSong = $(".song.active");
				const activeSongPosition =
					activeSong.offsetTop - activeSong.offsetHeight;
				const dashboardPosition = dashboard.offsetHeight;

				return activeSongPosition - dashboardPosition >
					dashboardPosition
					? false
					: true;
			},
		});
	},

	handleEvents: function () {
		const cdWidth = cd.offsetWidth;
		const isTouch = "touchstart" || "mousedown";

		// Xử lý cd quay
		const cdThumbAnimate = cdThumb.animate(
			[{ transform: "rotate(360deg)" }],
			{
				duration: 10000, // 10 seconds
				iterations: Infinity,
			}
		);

		cdThumbAnimate.pause();

		// phóng to thu nhỏ CD
		document.onscroll = () => {
			const scrollTop =
				window.scrollY || document.documentElement.scrollTop;
			const newCdWidth = cdWidth - scrollTop;

			cd.style.width = newCdWidth > 0 ? newCdWidth + "px" : 0;
			cd.style.opacity = newCdWidth / cdWidth;
		};

		// click play
		playBtn.onclick = () => {
			if (this.isPlaying) return audio.pause();

			audio.play();
		};

		// khi audio được play
		audio.onplay = () => {
			this.isPlaying = true;
			player.classList.add("playing");
			cdThumbAnimate.play();
		};

		// khi audio được pause
		audio.onpause = () => {
			this.isPlaying = false;
			player.classList.remove("playing");
			cdThumbAnimate.pause();
		};

		//khi audio playing
		audio.ontimeupdate = () => {
			// nếu duration NaN hoặc người dùng đang tua thì dừng update progress
			if (!audio.duration || this.isSeeking) return;

			const progressPercent = Math.floor(
				(audio.currentTime / audio.duration) * 1000
			);

			progress.value = progressPercent;

			// display time audio
			songCurrentTime.textContent = this.secToTime(audio.currentTime);

			songDuration.textContent = this.secToTime(audio.duration);
		};

		// Khi hết bài
		audio.onended = () => {
			if (this.isRepeat) return audio.play();

			nextBtn.click();
		};

		// Khi chạm và progress
		progress.addEventListener(isTouch, () => (this.isSeeking = true));

		// Khi tua
		progress.onchange = (e) => {
			const seekTime = (audio.duration / 1000) * Number(e.target.value);

			audio.currentTime = seekTime;

			this.isSeeking = false;
		};

		// Khi click next
		nextBtn.onclick = () => {
			if (this.isRandom) this.randomSong();
			else this.nextSong();

			this.render();

			this.scrollToActiveSong();

			audio.play();
		};

		//Khi click prev
		prevBtn.onclick = () => {
			if (this.isRandom) this.randomSong();
			else this.prevSong();

			this.render();

			this.scrollToActiveSong();

			audio.play();
		};

		// Khi toggle random
		randomBtn.onclick = () => {
			this.isRandom = !this.isRandom;

			this.setConfig("isRandom", this.isRandom);

			randomBtn.classList.toggle("active", this.isRandom);
		};

		// Khi toggle repeat
		repeatBtn.onclick = () => {
			this.isRepeat = !this.isRepeat;

			this.setConfig("isRepeat", this.isRepeat);

			repeatBtn.classList.toggle("active", this.isRepeat);
		};

		// chọn bài hát để play
		playlist.onclick = (e) => {
			const songNode = e.target.closest(".song:not(.active)");
			const option = e.target.closest(".option");

			if (!songNode && !option) return;

			// chức năng option
			if (option) return;

			this.currentIndex = Number(songNode.dataset.index);
			this.loadCurrentSong();
			this.render();

			audio.play();
		};
	},

	scrollToActiveSong: function () {
		const block = this.songActiveIsHidden ? "end" : "nearest";

		setTimeout(() => {
			$(".song.active").scrollIntoView({
				behavior: "smooth",
				block: block,
			});
		}, 300);
	},

	loadCurrentSong: function () {
		heading.textContent = this.currentSong.name;
		cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
		audio.src = this.currentSong.path;

		this.setConfig("currentIndex", this.currentIndex);
	},

	loadConfig: function () {
		this.isRandom = this.config.isRandom || false;
		this.isRepeat = this.config.isRepeat || false;
		this.currentIndex = this.config.currentIndex || 0;
	},

	handleAfterLoadConfig: function () {
		randomBtn.classList.toggle("active", this.isRandom);
		repeatBtn.classList.toggle("active", this.isRepeat);
		this.scrollToActiveSong();
	},

	nextSong: function () {
		this.currentIndex =
			this.currentIndex >= this.songs.length - 1
				? 0
				: this.currentIndex + 1;

		this.loadCurrentSong();
	},

	prevSong: function () {
		this.currentIndex =
			this.currentIndex <= 0
				? this.songs.length - 1
				: this.currentIndex - 1;

		this.loadCurrentSong();
	},

	randomSong: function () {
		const equals = (a, b) =>
			a.length === b.length && a.every((v) => b.includes(v));

		let newIndex;

		do {
			newIndex = Math.floor(Math.random() * this.songs.length);
		} while (
			newIndex === this.currentIndex || //lặp lại khi newIndex = currentIndex hoặc randomSongsPlayed đã chứa newIndex
			this.randomSongsPlayed.includes(newIndex)
		);

		this.currentIndex = newIndex;

		this.randomSongsPlayed.push(newIndex);

		this.loadCurrentSong();

		// nếu chưa play hết list
		if (!equals(this.randomSongsPlayed, [...this.songs.keys()])) return;

		this.randomSongsPlayed = [];
	},

	secToTime: function (seconds) {
		let min = Math.floor(seconds / 60);
		let sec = Math.floor(seconds % 60);

		min = min >= 10 ? min : "0" + min;
		sec = sec >= 10 ? sec : "0" + sec;

		return `${min} : ${sec}`;
	},

	start: function () {
		this.loadConfig();

		// Định nghĩa các thuộc tính cho object
		this.defineProperties();

		this.handleEvents();

		this.loadCurrentSong();

		this.render();

		// hiển thị trạng thái sau khi loadConfig
		this.handleAfterLoadConfig();
	},
};

app.start();

package lat.yavaa.android.core.config

data class YavaaConfig(
    val supabaseUrl: String,
    val supabasePublishableKey: String,
    val backendBaseUrl: String
) {
    companion object {
        fun from(
            supabaseUrl: String,
            supabasePublishableKey: String,
            backendBaseUrl: String
        ): YavaaConfig {
            val cleanSupabaseUrl = normalizeRequiredUrl(supabaseUrl, "Supabase URL")
            val cleanBackendBaseUrl = normalizeRequiredUrl(backendBaseUrl, "Backend base URL")
            val cleanPublishableKey = supabasePublishableKey.trim()

            require(cleanPublishableKey.isNotEmpty()) { "Supabase publishable key is required" }
            require(!cleanPublishableKey.contains("service_role", ignoreCase = true)) {
                "Supabase service role keys must never be used in Android"
            }

            return YavaaConfig(
                supabaseUrl = cleanSupabaseUrl,
                supabasePublishableKey = cleanPublishableKey,
                backendBaseUrl = cleanBackendBaseUrl
            )
        }

        private fun normalizeRequiredUrl(value: String, label: String): String {
            val trimmed = value.trim().trimEnd('/')
            require(trimmed.isNotEmpty()) { "$label is required" }
            require(trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
                "$label must start with http:// or https://"
            }
            return trimmed
        }
    }
}


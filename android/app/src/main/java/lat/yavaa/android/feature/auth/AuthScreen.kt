package lat.yavaa.android.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp

@Composable
fun AuthScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = "Yavaa",
            style = MaterialTheme.typography.headlineLarge
        )
        Text(
            text = "Ingresa para coordinar servicios",
            modifier = Modifier.padding(top = 8.dp),
            style = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.loading,
            singleLine = true,
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.loading,
            singleLine = true,
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(onDone = { viewModel.signIn() })
        )

        state.errorMessage?.let { message ->
            Text(
                text = message,
                modifier = Modifier.padding(top = 12.dp),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Button(
            onClick = viewModel::signIn,
            enabled = !state.loading,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 20.dp)
        ) {
            if (state.loading) {
                CircularProgressIndicator()
            } else {
                Text("Ingresar")
            }
        }
    }
}


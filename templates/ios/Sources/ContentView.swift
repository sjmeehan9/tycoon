import SwiftUI

struct ContentView: View {
    var body: some View {
        Text(Bootstrap.greeting())
            .accessibilityIdentifier("bootstrap.greeting")
            .padding()
    }
}

#Preview {
    ContentView()
}
